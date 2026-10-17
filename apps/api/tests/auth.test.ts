import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import {
  authenticate,
  requireRoles,
  type AuthEnv,
} from "../src/middlewares/auth";

// Khóa giả chỉ dùng cho test, không phải khóa trong .env.
const TEST_SECRET = "fpc13-test-secret-at-least-32-characters";
const WRONG_SECRET = "fpc13-wrong-secret-at-least-32-characters";

let originalSecret: string | undefined;

beforeEach(() => {
  originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

function createTestApp() {
  const app = new Hono<AuthEnv>();

  app.use("/protected/*", authenticate);

  app.get("/protected/me", (c) => {
    return c.json({ user: c.get("user") });
  });

  app.get("/protected/admin", requireRoles("Admin"), (c) => {
    return c.json({ message: "Admin truy cập thành công" });
  });

  app.get("/protected/manage", requireRoles("Admin", "Organizer"), (c) =>
    c.json({ message: "Được phép quản lý" }),
  );

  // Kiểm tra requireRoles khi chưa chạy authenticate.
  app.get("/roles-only", requireRoles("Admin"), (c) => {
    return c.json({ message: "Thành công" });
  });

  return app;
}

async function createToken(
  overrides: Record<string, unknown> = {},
  secret = TEST_SECRET,
) {
  return sign(
    {
      id: "user-test-01",
      role: "Participant",
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    },
    secret,
    "HS256",
  );
}

describe("Kiểm tra xác thực JWT", () => {
  test("Thiếu token trả về 401", async () => {
    const response = await createTestApp().request("/protected/me");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Missing or invalid authorization token",
    });
  });

  test("Sai định dạng Authorization trả về 401", async () => {
    const token = await createToken();
    const response = await createTestApp().request("/protected/me", {
      headers: { Authorization: `Basic ${token}` },
    });

    expect(response.status).toBe(401);
  });

  test("Token không hợp lệ trả về 401", async () => {
    const response = await createTestApp().request("/protected/me", {
      headers: { Authorization: "Bearer invalid-token" },
    });

    expect(response.status).toBe(401);
  });

  test("Token ký bằng khóa sai trả về 401", async () => {
    const token = await createToken({}, WRONG_SECRET);
    const response = await createTestApp().request("/protected/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
  });

  test("Token hết hạn trả về 401", async () => {
    const token = await createToken({
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const response = await createTestApp().request("/protected/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
  });

  test("Token thiếu exp trả về 401", async () => {
    const token = await sign(
      { id: "user-test-01", role: "Participant" },
      TEST_SECRET,
      "HS256",
    );
    const response = await createTestApp().request("/protected/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
  });

  test("Token có id rỗng trả về 401", async () => {
    const token = await createToken({ id: "" });
    const response = await createTestApp().request("/protected/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
  });

  test("Vai trò không hợp lệ trả về 401", async () => {
    const token = await createToken({ role: "Unknown" });
    const response = await createTestApp().request("/protected/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
  });

  test("Token hợp lệ trả về đúng thông tin người dùng", async () => {
    const token = await createToken();
    const response = await createTestApp().request("/protected/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        id: "user-test-01",
        role: "Participant",
      },
    });
  });

  test("Thiếu cấu hình JWT_SECRET trả về 500", async () => {
    delete process.env.JWT_SECRET;

    const response = await createTestApp().request("/protected/me");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "JWT_SECRET is not configured",
    });
  });
});

describe("Kiểm tra quyền truy cập", () => {
  test("Admin được truy cập API Admin", async () => {
    const token = await createToken({ role: "Admin" });
    const response = await createTestApp().request("/protected/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Admin truy cập thành công",
    });
  });

  test("Participant không được truy cập API Admin", async () => {
    const token = await createToken({ role: "Participant" });
    const response = await createTestApp().request("/protected/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Forbidden: insufficient permissions",
    });
  });

  test("Organizer được truy cập API quản lý", async () => {
    const token = await createToken({ role: "Organizer" });
    const response = await createTestApp().request("/protected/manage", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
  });

  test("Judge không được truy cập API quản lý", async () => {
    const token = await createToken({ role: "Judge" });
    const response = await createTestApp().request("/protected/manage", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(403);
  });

  test("Chưa xác thực thì requireRoles trả về 401", async () => {
    const response = await createTestApp().request("/roles-only");

    expect(response.status).toBe(401);
  });
});
