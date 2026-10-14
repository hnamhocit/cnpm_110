
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

export const authenticate = createMiddleware<AuthEnv>(
  async (c, next) => {
    const secret = Bun.env.JWT_SECRET;

    if (!secret) {
      return c.json({ error: "JWT_SECRET is not configured" }, 500);
    }

    const authorization = c.req.header("Authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      return c.json({ error: "Missing or invalid authorization token" }, 401);
    }

    try {
      const payload = await verify(token, secret);

      const id = payload.id;
      const role = payload.role;

      if (typeof id !== "string" || !isRole(role)) {
        return c.json({ error: "Invalid token payload" }, 401);
      }

      c.set("user", { id, role });
      await next();
    } catch {
      return c.json({ error: "Invalid or expired token" }, 401);
    }
  },
);

export function requireRoles(...allowedRoles: Role[]) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get("user");

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: "Forbidden: insufficient permissions" }, 403);
    }

    await next();
  });
}
