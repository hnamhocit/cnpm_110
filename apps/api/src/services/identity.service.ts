import { env } from "../config/env";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { accountAuditLogs, accountChallenges, roles, userRoles, users } from "../db/schema";
import type { Role } from "../middlewares/auth";
import { AppError } from "../utils/errors";
import { revokeAccountSessions } from "./auth.service";
import type { IdentityDelivery } from "./identity-delivery";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Purpose = "email" | "password_reset";
type Account = typeof users.$inferSelect;

const CODE_TTL_MS = 15 * 60_000;
const RESEND_MS = 60_000;
const MAX_ATTEMPTS = 5;

function digest(purpose: Purpose, value: string) {
  return createHmac("sha256", env.jwtSecret).update(`identity:${purpose}:${value}`).digest("hex");
}

function challengeKey(accountId: string, purpose: Purpose) {
  return and(eq(accountChallenges.accountId, accountId), eq(accountChallenges.purpose, purpose));
}

async function getAccountByEmail(tx: Transaction, email: string) {
  const [account] = await tx.select().from(users).where(eq(sql`LOWER(${users.email})`, email))
    .limit(1).for("update");
  return account;
}

async function issueChallenge(tx: Transaction, accountId: string, purpose: Purpose) {
  const [existing] = await tx.select().from(accountChallenges).where(challengeKey(accountId, purpose));
  const now = Date.now();
  if (existing && now - existing.requestedAt.getTime() < RESEND_MS) return null;

  const raw = purpose === "email" ? randomInt(1_000_000).toString().padStart(6, "0")
    : randomBytes(32).toString("base64url");
  const challenge = {
    tokenHash: digest(purpose, raw),
    expiresAt: new Date(now + CODE_TTL_MS),
    requestedAt: new Date(now),
    consumedAt: null,
    attempts: 0,
  };
  await tx.insert(accountChallenges).values({ accountId, purpose, ...challenge })
    .onConflictDoUpdate({ target: [accountChallenges.accountId, accountChallenges.purpose], set: challenge });
  return raw;
}

async function consumeChallenge(tx: Transaction, accountId: string, purpose: Purpose, value: string) {
  const key = challengeKey(accountId, purpose);
  const [challenge] = await tx.select().from(accountChallenges).where(key);
  if (!challenge || challenge.consumedAt || challenge.attempts >= MAX_ATTEMPTS ||
      challenge.expiresAt.getTime() <= Date.now()) return false;

  const expected = Buffer.from(challenge.tokenHash, "hex");
  if (!timingSafeEqual(expected, Buffer.from(digest(purpose, value), "hex"))) {
    await tx.update(accountChallenges).set({ attempts: challenge.attempts + 1 }).where(key);
    return false;
  }
  await tx.update(accountChallenges).set({ consumedAt: new Date() }).where(key);
  return true;
}

export async function createPendingAccount(
  input: { fullName: string; email: string; password: string; phoneNumber?: string; role: Role },
  delivery: IdentityDelivery,
  actorId?: string,
) {
  const { fullName, email, password, phoneNumber, role } = input;
  const passwordHash = await Bun.password.hash(password);
  const result = await db.transaction(async (tx) => {
    if (await getAccountByEmail(tx, email)) throw AppError.conflict("Email is already registered");
    const [assignedRole] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.name, role));
    if (!assignedRole) throw new AppError("Requested role is unavailable", 503);

    const [user] = await tx.insert(users).values({
      fullName, email, passwordHash, phoneNumber, verificationRequired: true,
    }).onConflictDoNothing({ target: users.email }).returning({
      id: users.id, fullName: users.fullName, email: users.email, createdAt: users.createdAt,
    });
    if (!user) throw AppError.conflict("Email is already registered");
    await tx.insert(userRoles).values({ userId: user.id, roleId: assignedRole.id });
    if (actorId) {
      await tx.insert(accountAuditLogs).values({
        actorId, accountId: user.id, action: "ACCOUNT_CREATED", changes: { role },
      });
    }
    const code = await issueChallenge(tx, user.id, "email");
    if (!code) throw AppError.conflict("Verification is already pending");
    return { user, code };
  });
  const deliveryStatus = await deliverCode(() => delivery.emailCode(email, result.code));
  return { user: { ...result.user, role }, status: "PENDING_VERIFICATION", deliveryStatus };
}

async function deliverCode(send: () => Promise<void>) {
  try {
    await send();
    return "ACCEPTED";
  } catch {
    return "RETRY_REQUIRED";
  }
}

export async function verifyAccountEmail(email: string, code: string) {
  const verified = await db.transaction(async (tx) => {
    const account = await getAccountByEmail(tx, email);
    if (!account?.isActive || account.emailVerifiedAt ||
        !await consumeChallenge(tx, account.id, "email", code)) return false;
    await tx.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, account.id));
    return true;
  });
  if (!verified) throw AppError.badRequest("Invalid or expired verification code");
  return { status: "ACTIVE" };
}

export async function resendAccountVerification(
  email: string, password: string, delivery: IdentityDelivery,
) {
  const code = await db.transaction(async (tx) => {
    const account = await getAccountByEmail(tx, email);
    if (!account?.isActive || account.emailVerifiedAt ||
        !await Bun.password.verify(password, account.passwordHash)) return null;
    return issueChallenge(tx, account.id, "email");
  });
  return { deliveryStatus: code ? await deliverCode(() => delivery.emailCode(email, code)) : "ACCEPTED" };
}

export async function requestPasswordReset(email: string, delivery: IdentityDelivery) {
  const token = await db.transaction(async (tx) => {
    const account = await getAccountByEmail(tx, email);
    if (!account?.isActive || !account.emailVerifiedAt) return null;
    return issueChallenge(tx, account.id, "password_reset");
  });
  if (token) await deliverCode(() => delivery.passwordReset(email, token));
}

export async function resetAccountPassword(token: string, newPassword: string) {
  const result = await db.transaction(async (tx) => {
    const [challenge] = await tx.select({ accountId: accountChallenges.accountId }).from(accountChallenges)
      .where(and(eq(accountChallenges.purpose, "password_reset"),
        eq(accountChallenges.tokenHash, digest("password_reset", token))));
    if (!challenge) return false;
    const [account] = await tx.select().from(users).where(eq(users.id, challenge.accountId)).for("update");
    if (!account?.isActive || !account.emailVerifiedAt ||
        !await consumeChallenge(tx, account.id, "password_reset", token)) return false;
    await tx.update(users).set({
      passwordHash: await Bun.password.hash(newPassword),
      failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date(),
    }).where(eq(users.id, account.id));
    await revokeAccountSessions(tx, account.id);
    await tx.insert(accountAuditLogs).values({
      actorId: account.id, accountId: account.id, action: "PASSWORD_RESET", changes: {},
    });
    return true;
  });
  if (!result) throw AppError.badRequest("Invalid or expired password reset token");
}
