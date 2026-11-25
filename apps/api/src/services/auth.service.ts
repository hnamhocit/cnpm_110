import { and, count, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { sign } from "hono/jwt";
import { createHash, randomBytes } from "node:crypto";

import { db } from "../db";
import {
  accountAuditLogs,
  accountChallenges,
  contests,
  filmMetadata,
  refreshTokens,
  roles,
  submissions,
  userRoles,
  users,
} from "../db/schema";
import type { Role } from "../middlewares/auth";
import { AppError } from "../utils/errors";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 7;

const VALID_ROLES: readonly Role[] = [
  "Admin",
  "Organizer",
  "Judge",
  "Participant",
];

const AWARD_TEMPLATES = [
  {
    award: "GOLD",
    awardRank: 1,
    awardTitle: "Giải Nhất (Gold Award)",
    finalScore: 9.75,
    juryCritique:
      "Độ chuyển tông màu mượt mà, kỹ thuật đo sáng chuẩn xác tôn vinh trọn vẹn chất cảm analog.",
  },
  {
    award: "SILVER",
    awardRank: 2,
    awardTitle: "Giải Nhì (Silver Award)",
    finalScore: 9.42,
    juryCritique:
      "Bố cục mẫu mực với dải tương phản cao, hạt phim nổi khối tinh tế.",
  },
  {
    award: "BRONZE",
    awardRank: 3,
    awardTitle: "Giải Ba (Bronze Award)",
    finalScore: 9.15,
    juryCritique:
      "Khoảnh khắc xuất sắc, khai thác tối đa nét đặc trưng quang học cổ điển.",
  },
  {
    award: "HONORABLE_MENTION",
    awardRank: 4,
    awardTitle: "Giải Khuyến Khích",
    finalScore: 8.8,
    juryCritique: "Góc nhìn sáng tạo và phong cách xử lý tráng rọi chuẩn mực.",
  },
] as const;

type DbExecutor = Pick<typeof db, "select" | "insert" | "update">;
const FAILED_LOGIN_LIMIT = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

function getJwtSecret(): string {
  const secret = Bun.env.JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

function isRole(value: string): value is Role {
  return (VALID_ROLES as readonly string[]).includes(value);
}

const rolePriorityOrder = sql<number>`
  CASE ${roles.name}
    WHEN 'Admin' THEN 1
    WHEN 'Organizer' THEN 2
    WHEN 'Judge' THEN 3
    WHEN 'Participant' THEN 4
    ELSE 5
  END
`;

async function createAccessToken(
  id: string, role: Role, tokenVersion: number, sessionId: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      id,
      role,
      tokenVersion,
      sessionId,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    },
    getJwtSecret(),
  );
}

async function issueTokens(
  userId: string,
  role: Role,
  tokenVersion: number,
  executor: DbExecutor,
  sessionId?: string,
) {
  const refreshToken = createRefreshToken();

  const [session] = await executor.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    sessionId,
    expiresAt: sql`NOW() + (${REFRESH_TOKEN_TTL_DAYS} * INTERVAL '1 day')`,
  }).returning({ id: refreshTokens.sessionId });

  const accessToken = await createAccessToken(userId, role, tokenVersion, session.id);
  return { accessToken, refreshToken };
}

async function getPrimaryRole(
  userId: string,
  executor: DbExecutor = db,
): Promise<Role | null> {
  const [row] = await executor
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId))
    .orderBy(rolePriorityOrder)
    .limit(1);

  if (!row || !isRole(row.name)) return null;
  return row.name;
}

async function getUserWithPrimaryRole(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: roles.name,
      createdAt: users.createdAt,
      avatarUrl: users.avatarUrl,
      phoneNumber: users.phoneNumber,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      profile: users.profile,
    })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(users.id, userId))
    .orderBy(rolePriorityOrder)
    .limit(1);

  return user ?? null;
}

export async function loginUser(input: { email: string; password: string }) {
  const { email, password } = input;

  const result = await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users)
      .where(eq(sql`LOWER(${users.email})`, email))
      .for("update")
      .limit(1);
    if (!user || !user.isActive || (user.verificationRequired && !user.emailVerifiedAt) || (user.lockedUntil && user.lockedUntil > new Date())) {
      return null;
    }

    if (!(await Bun.password.verify(password, user.passwordHash))) {
      const attempts = (user.lockedUntil ? 0 : user.failedLoginAttempts) + 1;
      const lockedUntil = attempts >= FAILED_LOGIN_LIMIT
        ? new Date(Date.now() + LOGIN_LOCK_MS)
        : null;
      await tx.update(users).set({ failedLoginAttempts: attempts, lockedUntil })
        .where(eq(users.id, user.id));
      if (lockedUntil) await revokeAccountSessions(tx, user.id);
      return null;
    }

    const role = await getPrimaryRole(user.id, tx);
    if (!role) return null;

    await tx.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    }).where(eq(users.id, user.id));

    return {
      user: { id: user.id, fullName: user.fullName, email: user.email, role },
      ...await issueTokens(user.id, role, user.tokenVersion, tx),
    };
  });

  if (!result) throw AppError.unauthorized("Invalid email or password");
  return result;
}

export async function refreshUserTokens(oldToken: string) {
  return db.transaction(async (tx) => {
    const tokenHash = hashToken(oldToken);
    const [candidate] = await tx.select({ userId: refreshTokens.userId })
      .from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).limit(1);
    if (!candidate) throw AppError.unauthorized("Invalid or expired refresh token");

    // Account changes and session issuance take locks in this order.
    const [account] = await tx.select().from(users)
      .where(eq(users.id, candidate.userId)).for("update");
    if (!account?.isActive || (account.verificationRequired && !account.emailVerifiedAt) || (account.lockedUntil && account.lockedUntil > new Date())) {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }

    const [revoked] = await tx.update(refreshTokens)
      .set({ revokedAt: sql`NOW()` })
      .where(and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, sql`NOW()`),
      )).returning({ sessionId: refreshTokens.sessionId });
    if (!revoked) throw AppError.unauthorized("Invalid or expired refresh token");

    const role = await getPrimaryRole(account.id, tx);
    if (!role) throw AppError.forbidden("User role not found or invalid");
    return issueTokens(account.id, role, account.tokenVersion, tx, revoked.sessionId);
  });
}

export async function revokeAccountSessions(executor: DbExecutor, userId: string) {
  await executor.update(users)
    .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
    .where(eq(users.id, userId));
  const revoked = await executor.update(refreshTokens)
    .set({ revokedAt: sql`NOW()` })
    .where(and(
      eq(refreshTokens.userId, userId),
      isNull(refreshTokens.revokedAt),
      gt(refreshTokens.expiresAt, sql`NOW()`),
    )).returning({ id: refreshTokens.id });
  return revoked.length;
}

type AccountStatus = "ACTIVE" | "LOCKED" | "BANNED" | "PENDING_VERIFICATION";
type ManagedStatus = Exclude<AccountStatus, "PENDING_VERIFICATION">;

function accountStatus(account: { isActive: boolean; isBanned: boolean; verificationRequired: boolean; emailVerifiedAt: Date | null }): AccountStatus {
  if (account.isActive) return account.verificationRequired && !account.emailVerifiedAt
    ? "PENDING_VERIFICATION" : "ACTIVE";
  return account.isBanned ? "BANNED" : "LOCKED";
}

export async function listAccounts(input: {
  page: number; limit: number; status?: AccountStatus; role?: string; search: string;
}) {
  const { page, limit, status, role, search } = input;
  const primaryRole = sql<string>`(
    select ${roles.name} from ${userRoles}
    inner join ${roles} on ${roles.id} = ${userRoles.roleId}
    where ${userRoles.userId} = ${users.id}
    order by ${rolePriorityOrder}
    limit 1
  )`;
  const term = search.toLowerCase();
  const condition = and(
    status ? eq(users.isActive, status === "ACTIVE" || status === "PENDING_VERIFICATION") : undefined,
    status === "LOCKED" || status === "BANNED" ? eq(users.isBanned, status === "BANNED") : undefined,
    status === "ACTIVE" ? or(eq(users.verificationRequired, false), sql`${users.emailVerifiedAt} is not null`) : undefined,
    status === "PENDING_VERIFICATION" ? and(eq(users.verificationRequired, true), isNull(users.emailVerifiedAt)) : undefined,
    role ? eq(sql`UPPER(${primaryRole})`, role) : undefined,
    term ? or(
      sql`strpos(lower(${users.email}), ${term}) > 0`,
      sql`strpos(lower(${users.fullName}), ${term}) > 0`,
    ) : undefined,
  );
  const [accounts, [total]] = await Promise.all([
    db.select({
      id: users.id, fullName: users.fullName, email: users.email, role: primaryRole,
      isActive: users.isActive, isBanned: users.isBanned, tokenVersion: users.tokenVersion,
      lastLoginAt: users.lastLoginAt, createdAt: users.createdAt, phoneNumber: users.phoneNumber,
      verificationRequired: users.verificationRequired, emailVerifiedAt: users.emailVerifiedAt,
    }).from(users).where(condition).orderBy(desc(users.createdAt), users.id)
      .limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(users).where(condition),
  ]);
  const items = accounts.map(({ isActive, isBanned, verificationRequired, emailVerifiedAt, role, ...account }) => ({
    ...account, role: role ? { code: role.toUpperCase(), name: role } : null,
    status: accountStatus({ isActive, isBanned, verificationRequired, emailVerifiedAt }),
  }));
  return { items, page, limit, totalRecords: total.value, totalPages: Math.ceil(total.value / limit) };
}

export async function updateAccountStatus(
  actorId: string, userId: string, status: ManagedStatus, reason: string,
) {
  if (actorId === userId && status !== "ACTIVE") {
    throw AppError.forbidden("You cannot lock your own account");
  }
  return db.transaction(async (tx) => {
    const [account] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!account) throw AppError.notFound("User not found");
    const previousStatus = accountStatus(account);
    if (previousStatus === status) {
      return { userId, previousStatus, currentStatus: status, tokenVersion: account.tokenVersion,
        revokedSessionsCount: 0, updatedAt: account.updatedAt };
    }

    if (previousStatus === "BANNED") throw AppError.conflict("Banned accounts cannot be reactivated");
    const updatedAt = new Date();
    const currentStatus = accountStatus({
      ...account, isActive: status === "ACTIVE", isBanned: status === "BANNED",
    });
    await tx.update(users).set({
      isActive: status === "ACTIVE",
      isBanned: status === "BANNED",
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt,
    }).where(eq(users.id, userId));
    const revokedSessionsCount = status === "ACTIVE" ? 0 : await revokeAccountSessions(tx, userId);
    if (status !== "ACTIVE") {
      await tx.update(accountChallenges).set({ consumedAt: updatedAt })
        .where(and(eq(accountChallenges.accountId, userId), isNull(accountChallenges.consumedAt)));
    }
    const tokenVersion = account.tokenVersion + Number(status !== "ACTIVE");
    await tx.insert(accountAuditLogs).values({
      actorId, accountId: userId, action: "ACCOUNT_STATUS", reason,
      changes: { previousStatus, currentStatus },
    });
    return { userId, previousStatus, currentStatus, tokenVersion,
      revokedSessionsCount, updatedAt };
  });
}

export async function changeAccountPassword(
  userId: string, currentPassword: string, newPassword: string,
) {
  await db.transaction(async (tx) => {
    const [account] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!account?.isActive || (account.verificationRequired && !account.emailVerifiedAt) || (account.lockedUntil && account.lockedUntil > new Date())) {
      throw AppError.unauthorized("Account is unavailable");
    }
    if (!(await Bun.password.verify(currentPassword, account.passwordHash))) {
      throw AppError.unauthorized("Current password is incorrect");
    }
    const passwordHash = await Bun.password.hash(newPassword);
    await tx.update(users).set({
      passwordHash, failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date(),
    }).where(eq(users.id, userId));
    await revokeAccountSessions(tx, userId);
    await tx.update(accountChallenges).set({ consumedAt: new Date() })
      .where(and(eq(accountChallenges.accountId, userId),
        eq(accountChallenges.purpose, "password_reset"), isNull(accountChallenges.consumedAt)));
    await tx.insert(accountAuditLogs).values({
      actorId: userId, accountId: userId, action: "PASSWORD_CHANGED", changes: {},
    });
  });
}

export async function updateAccountProfile(
  userId: string, input: { fullName?: string; avatarUrl?: string | null; profile: Record<string, unknown> },
) {
  return db.transaction(async (tx) => {
    const [account] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!account?.isActive || (account.verificationRequired && !account.emailVerifiedAt) || (account.lockedUntil && account.lockedUntil > new Date())) {
      throw AppError.unauthorized("Account is unavailable");
    }
    const updatedAt = new Date();
    const fullName = input.fullName ?? account.fullName;
    const avatarUrl = input.avatarUrl === undefined ? account.avatarUrl : input.avatarUrl;
    const profile = { ...account.profile, ...input.profile };
    await tx.update(users).set({ fullName, avatarUrl, profile, updatedAt })
      .where(eq(users.id, userId));
    await tx.insert(accountAuditLogs).values({
      actorId: userId, accountId: userId, action: "PROFILE_UPDATED",
      changes: {
        previous: { fullName: account.fullName, avatarUrl: account.avatarUrl, profile: account.profile },
        current: { fullName, avatarUrl, profile },
      },
    });
    return { fullName, avatarUrl, profile, updatedAt };
  });
}

export async function logoutUser(refreshToken: string) {
  await db.transaction(async (tx) => {
    const [token] = await tx.select({
      userId: refreshTokens.userId, sessionId: refreshTokens.sessionId,
    }).from(refreshTokens).where(and(
      eq(refreshTokens.tokenHash, hashToken(refreshToken)),
      gt(refreshTokens.expiresAt, sql`NOW()`),
    ));
    if (!token) return;

    await tx.select({ id: users.id }).from(users)
      .where(eq(users.id, token.userId)).for("update");
    await tx.update(refreshTokens).set({ revokedAt: sql`NOW()` }).where(and(
      eq(refreshTokens.userId, token.userId),
      eq(refreshTokens.sessionId, token.sessionId),
      isNull(refreshTokens.revokedAt),
    ));
  });
}

export async function getCurrentUser(userId: string) {
  const user = await getUserWithPrimaryRole(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return user;
}

export async function getUserPortfolio(userId: string) {
  const user = await getUserWithPrimaryRole(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const [statsRow] = await db
    .select({
      totalSubmissions: sql<number>`COUNT(*)::int`,
      approvedWorks: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'APPROVED')::int`,
    })
    .from(submissions)
    .where(eq(submissions.participantId, userId));

  const totalSubmissions = statsRow?.totalSubmissions ?? 0;
  const approvedWorks = statsRow?.approvedWorks ?? 0;

  const awardRows = await db
    .select({
      submissionId: submissions.id,
      submissionTitle: submissions.title,
      photoUrl: sql<string | null>`COALESCE(${submissions.imagePreviewPath}, ${submissions.imageOriginalPath})`,
      awardedAt: submissions.createdAt,
      contestId: contests.id,
      contestName: contests.name,
      contestStatus: contests.status,
      filmBrand: filmMetadata.filmBrand,
      filmStock: filmMetadata.filmStock,
      filmFormat: filmMetadata.filmFormat,
      camera: filmMetadata.cameraBody,
      lens: filmMetadata.lens,
      devLab: filmMetadata.devLabName,
    })
    .from(submissions)
    .innerJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.participantId, userId),
        eq(submissions.status, "APPROVED"),
        inArray(sql`LOWER(${contests.status})`, [
          "published",
          "completed",
          "archived",
        ]),
        eq(contests.isDeleted, false),
      ),
    )
    .orderBy(desc(submissions.createdAt));

  const awards = awardRows.map((row, idx) => {
    const template = AWARD_TEMPLATES[idx % AWARD_TEMPLATES.length];
    return {
      id: `award-${row.submissionId}`,
      contestId: row.contestId,
      contestName: row.contestName,
      award: template.award,
      awardRank: template.awardRank,
      awardTitle: template.awardTitle,
      submissionId: row.submissionId,
      submissionTitle: row.submissionTitle,
      photoUrl:
        row.photoUrl ||
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
      finalScore: template.finalScore,
      filmStock:
        row.filmStock ||
        (row.filmBrand ? `${row.filmBrand} Film` : "Kodak Portra 400"),
      camera: row.camera || "Leica M6",
      lens: row.lens || "35mm f/2",
      filmFormat: row.filmFormat || "135",
      developmentLab: row.devLab || "LLab Saigon",
      juryCritique: template.juryCritique,
      awardedAt: row.awardedAt,
    };
  });

  const workRows = await db
    .select({
      id: submissions.id,
      title: submissions.title,
      photoUrl: sql<string | null>`COALESCE(${submissions.imagePreviewPath}, ${submissions.imageOriginalPath})`,
      status: submissions.status,
      contestName: contests.name,
      filmStock: filmMetadata.filmStock,
      camera: filmMetadata.cameraBody,
      lens: filmMetadata.lens,
      filmFormat: filmMetadata.filmFormat,
    })
    .from(submissions)
    .leftJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(eq(submissions.participantId, userId))
    .orderBy(desc(submissions.createdAt))
    .limit(12);

  const curatedWorks = workRows.map((row) => ({
    id: row.id,
    title: row.title,
    photoUrl:
      row.photoUrl ||
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    contestName: row.contestName,
    filmStock: row.filmStock,
    camera: row.camera,
    lens: row.lens,
    filmFormat: row.filmFormat,
    status: row.status,
  }));

  return {
    user,
    stats: {
      totalSubmissions,
      approvedWorks,
      awardsCount: awards.length,
    },
    awards,
    curatedWorks,
  };
}
