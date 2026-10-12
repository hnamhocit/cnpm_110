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
  return (
    typeof value === "string" &&
    roles.includes(value as Role)
  );
}

// Kiểm tra token và lấy thông tin người dùng.
export const authenticate = createMiddleware<AuthEnv>(
  async (c, next) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return c.json({ message: "Server chưa cấu hình JWT_SECRET" }, 500);
    }

    const authorization = c.req.header("Authorization");
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      return c.json({ message: "Bạn cần đăng nhập" }, 401);
    }

    let payload;

    try {
      payload = await verify(match[1], secret, "HS256");
    } catch {
      return c.json({ message: "Token không hợp lệ hoặc đã hết hạn" }, 401);
    }

    if (
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return c.json({ message: "Token thiếu thông tin hoặc đã hết hạn" }, 401);
    }

    if (!isRole(payload.role)) {
      return c.json({ message: "Vai trò không được phép" }, 403);
    }

    c.set("user", {
      id: payload.sub,
      role: payload.role,
    });

    await next();
  }
);

// Chỉ cho phép các vai trò được chỉ định.
export function requireRoles(...allowedRoles: Role[]) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Bạn cần đăng nhập" }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ message: "Bạn không có quyền truy cập" }, 403);
    }

    await next();
  });
}