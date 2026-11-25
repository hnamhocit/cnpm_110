import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

export type Role = "Admin" | "Organizer" | "Judge" | "Participant";

export type AuthEnv = {
  Variables: {
    user: {
      id: string;
      role: Role;
    };
  };
};

const roles: Role[] = ["Admin", "Organizer", "Judge", "Participant"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export const createAuthenticator = (
  hasActiveRole: (userId: string, role: Role) => Promise<boolean>,
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

  if (!(await hasActiveRole(id, role))) {
    return c.json({ error: "Account or role is unavailable" }, 401);
  }

  c.set("user", { id, role });
  await next();
});

export const authenticate = createAuthenticator(async (id, role) => {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    return false;
  }

  const [{ db }, { roles, userRoles, users }, { and, eq }] = await Promise.all([
    import("../db"),
    import("../db/schema"),
    import("drizzle-orm"),
  ]);
  const [account] = await db.select({ id: users.id })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(eq(users.id, id), eq(users.isActive, true), eq(roles.name, role)))
    .limit(1);

  return Boolean(account);
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
