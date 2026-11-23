import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { verify } from "hono/jwt";
import { pool } from "../src/db";
import auth from "../src/routes/auth.route";
import { createTestApp } from "./helpers/test-app";

const TEST_DB_NAME = process.env.TEST_DB_NAME || "fpc_test";
const TEST_SECRET = "fpc13-integration-test-secret-at-least-32-characters";
const PASSWORD = "Fpc13Test@123";

const app = createTestApp();
app.route("/auth", auth);

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function post(path: string, body: Record<string, unknown>) {
  return app.request(`/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Integration test xác thực và refresh token", () => {
  let email: string;
  let databaseChecked = false;
  let originalSecret: string | undefined;

  beforeAll(async () => {
    const result = await pool.query("SELECT current_database() AS db");

    if (result.rows[0]?.db !== TEST_DB_NAME) {
      throw new Error(`Chỉ được chạy integration test trên ${TEST_DB_NAME}`);
    }

    // Đảm bảo role mặc định tồn tại kể cả trên DB test trống
    await pool.query(
      `INSERT INTO roles (name, description)
       VALUES ('Participant', 'Competition participant')
       ON CONFLICT (name) DO NOTHING`,
    );

    databaseChecked = true;
    originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = TEST_SECRET;
  });

  beforeEach(() => {
    email = `fpc13-${randomUUID()}@example.com`;
  });

  afterEach(async () => {
    if (databaseChecked) {
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
    }
  });

  afterAll(() => {
    if (databaseChecked) {
      if (originalSecret === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = originalSecret;
      }
    }
  });

  async function registerUser() {
    const response = await post("register", {
      fullName: "FPC13 Test User",
      email,
      password: PASSWORD,
    });

    expect(response.status).toBe(201);

    const raw = await response.json();
    const data = raw.data ?? raw;

    expect(data.user.id).toBeString();
    expect(data.accessToken).toBeString();
    expect(data.refreshToken).toBeString();

    return data;
  }

  test("Đăng ký lưu người dùng và hash refresh token", async () => {
    const data = await registerUser();

    expect(data.user.email).toBe(email);
    expect(data.user.role).toBe("Participant");

    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [data.user.id],
    );

    const passwordHash = userResult.rows[0].password_hash;
    expect(passwordHash).not.toBe(PASSWORD);
    expect(await Bun.password.verify(PASSWORD, passwordHash)).toBe(true);

    const tokenResult = await pool.query(
      `SELECT token_hash, revoked_at, expires_at
       FROM refresh_tokens WHERE user_id = $1`,
      [data.user.id],
    );

    expect(tokenResult.rows).toHaveLength(1);
    expect(tokenResult.rows[0].token_hash).toBe(hashToken(data.refreshToken));
    expect(tokenResult.rows[0].token_hash).not.toBe(data.refreshToken);
    expect(tokenResult.rows[0].revoked_at).toBeNull();
    expect(new Date(tokenResult.rows[0].expires_at).getTime()).toBeGreaterThan(
      Date.now(),
    );

    const payload = await verify(data.accessToken, TEST_SECRET, "HS256");
    expect(payload.id).toBe(data.user.id);
    expect(payload.role).toBe("Participant");
  });

  test("Đăng ký trùng email trả về 409", async () => {
    await registerUser();

    const response = await post("register", {
      fullName: "Duplicate User",
      email,
      password: PASSWORD,
    });

    expect(response.status).toBe(409);

    const result = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    expect(result.rows).toHaveLength(1);
  });

  test("Đăng nhập đúng mật khẩu trả về token hợp lệ", async () => {
    const registered = await registerUser();

    const response = await post("login", {
      email,
      password: PASSWORD,
    });

    expect(response.status).toBe(200);
    const raw = await response.json();
    const data = raw.data ?? raw;

    expect(data.user.id).toBe(registered.user.id);
    expect(data.refreshToken).toBeString();

    const payload = await verify(data.accessToken, TEST_SECRET, "HS256");
    expect(payload.id).toBe(registered.user.id);
  });

  test("Đăng nhập sai mật khẩu trả về 401", async () => {
    await registerUser();

    const response = await post("login", {
      email,
      password: "WrongPassword@123",
    });

    expect(response.status).toBe(401);
  });

  test("Refresh cấp token mới và vô hiệu hóa token cũ", async () => {
    const registered = await registerUser();

    const response = await post("refresh", {
      refreshToken: registered.refreshToken,
    });

    expect(response.status).toBe(200);
    const raw = await response.json();
    const data = raw.data ?? raw;

    expect(data.refreshToken).toBeString();
    expect(data.refreshToken).not.toBe(registered.refreshToken);

    const payload = await verify(data.accessToken, TEST_SECRET, "HS256");
    expect(payload.id).toBe(registered.user.id);

    const oldToken = await pool.query(
      "SELECT revoked_at FROM refresh_tokens WHERE token_hash = $1",
      [hashToken(registered.refreshToken)],
    );
    expect(oldToken.rows[0].revoked_at).not.toBeNull();

    const reused = await post("refresh", {
      refreshToken: registered.refreshToken,
    });
    expect(reused.status).toBe(401);

    const nextRefresh = await post("refresh", {
      refreshToken: data.refreshToken,
    });
    expect(nextRefresh.status).toBe(200);
  });

  test("Refresh token hết hạn trả về 401", async () => {
    const registered = await registerUser();

    await pool.query(
      `UPDATE refresh_tokens
       SET expires_at = NOW() - INTERVAL '1 minute'
       WHERE token_hash = $1`,
      [hashToken(registered.refreshToken)],
    );

    const response = await post("refresh", {
      refreshToken: registered.refreshToken,
    });

    expect(response.status).toBe(401);
  });

  test("Refresh token không tồn tại trả về 401", async () => {
    const response = await post("refresh", {
      refreshToken: `invalid-${randomUUID()}`,
    });

    expect(response.status).toBe(401);
  });

  test("Thiếu refresh token trả về 400", async () => {
    const response = await post("refresh", {});

    expect(response.status).toBe(400);
  });

  test("Đăng xuất thu hồi refresh token", async () => {
    const registered = await registerUser();

    const response = await post("logout", {
      refreshToken: registered.refreshToken,
    });

    expect(response.status).toBe(200);

    const result = await pool.query(
      "SELECT revoked_at FROM refresh_tokens WHERE token_hash = $1",
      [hashToken(registered.refreshToken)],
    );
    expect(result.rows[0].revoked_at).not.toBeNull();

    const refreshResponse = await post("refresh", {
      refreshToken: registered.refreshToken,
    });
    expect(refreshResponse.status).toBe(401);
  });
});
