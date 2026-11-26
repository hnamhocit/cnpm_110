import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { canGrant, type Permission } from "../services/permission-policy";
import { AppError } from "../utils/errors";

export type Role = "Admin" | "Organizer" | "Judge" | "Participant";

export type AuthEnv = {
  Variables: {
    user: {
      id: string;
      role: Role;
    };
  };
};

export const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const roles: Role[] = ["Admin", "Organizer", "Judge", "Participant"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export const createAuthenticator = (
  hasActiveRole: (userId: string, role: Role, tokenVersion: number, sessionId?: string) => Promise<boolean>,
) => createMiddleware<AuthEnv>(async (c, next) => {
  const secret = Bun.env.JWT_SECRET;

  if (!secret) {
    return c.json({ error: "JWT_SECRET is not configured" }, 500);
  }

  const authorization = c.req.header("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return c.json({ error: "Missing or invalid authorization token" }, 401);
  }

  const payload = await verify(token, secret, "HS256").catch(() => null);
  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  if (
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  const id = payload.id;
  const role = payload.role;

  if (typeof id !== "string" || id.trim().length === 0 || !isRole(role)) {
    return c.json({ error: "Invalid token payload" }, 401);
  }

  const tokenVersion = payload.tokenVersion ?? 0;
  const sessionId = payload.sessionId;
  if (typeof tokenVersion !== "number" || !Number.isSafeInteger(tokenVersion) || tokenVersion < 0 ||
      (sessionId !== undefined && (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId)))) {
    return c.json({ error: "Invalid token payload" }, 401);
  }

  if (!(await hasActiveRole(id, role, tokenVersion, sessionId))) {
    return c.json({ error: "Account or role is unavailable" }, 401);
  }

  c.set("user", { id, role });
  await next();
});

const authenticateAccount = createAuthenticator(async (id, role, tokenVersion, sessionId) => {
  if (!UUID_PATTERN.test(id)) {
    return false;
  }

  const [{ db }, { refreshTokens, roles, userRoles, users }, { and, eq, exists, gt, isNotNull, isNull, lte, or, sql }] = await Promise.all([
    import("../db"),
    import("../db/schema"),
    import("drizzle-orm"),
  ]);
  const activeSession = sessionId === undefined ? undefined : exists(
    db.select({ id: refreshTokens.id }).from(refreshTokens).where(and(
      eq(refreshTokens.sessionId, sessionId),
      eq(refreshTokens.userId, id),
      isNull(refreshTokens.revokedAt),
      gt(refreshTokens.expiresAt, sql`NOW()`),
    )),
  );
  const [account] = await db.select({ id: users.id })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(
      eq(users.id, id), eq(users.isActive, true), eq(roles.name, role),
      eq(users.tokenVersion, tokenVersion),
      or(eq(users.verificationRequired, false), isNotNull(users.emailVerifiedAt)),
      or(isNull(users.lockedUntil), lte(users.lockedUntil, sql`NOW()`)),
      activeSession,
    ))
    .limit(1);

  return Boolean(account);
});

export const authenticate = createMiddleware<AuthEnv>(async (c, next) => {
  return authenticateAccount(c, async () => {
    const { withAuditActor } = await import("../db");
    const rollback = new Error("Rollback failed request");
    try {
      await withAuditActor(c.get("user").id, async () => {
        await next();
        if (c.error || c.res.status >= 400) throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});

export function requireRoles(...allowedRoles: Role[]) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Missing or invalid authorization token" }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: "Forbidden: insufficient permissions" }, 403);
    }

    await next();
  });
}

export function requirePermission(permission: Permission) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) throw AppError.unauthorized();
    if (!canGrant(user.role, permission)) throw AppError.forbidden();

    await next();
  });
}
