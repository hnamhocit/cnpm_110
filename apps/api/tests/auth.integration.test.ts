import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { verify } from "hono/jwt";
import { pool } from "../src/db";
import { createAuthRoutes } from "../src/routes/auth.route";
import rbac from "../src/routes/rbac.route";
import { createUserRoutes } from "../src/routes/users.route";
import { createTestApp } from "./helpers/test-app";

const TEST_DB_NAME = process.env.TEST_DB_NAME || "fpc_test";
const TEST_SECRET = "fpc13-integration-test-secret-at-least-32-characters";
const PASSWORD = "Fpc13Test@123";

const app = createTestApp();
const emailCodes = new Map<string, string>();
const resetTokens = new Map<string, string>();
const fakeDelivery = {
  async emailCode(to: string, code: string) { emailCodes.set(to, code); },
  async passwordReset(to: string, token: string) { resetTokens.set(to, token); },
};
app.route("/auth", createAuthRoutes(fakeDelivery));
app.route("/users", createUserRoutes(fakeDelivery));
app.route("/rbac", rbac);

function signedRequest(path: string, accessToken: string, method = "GET", body?: Record<string, unknown>) {
  return app.request(path, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

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
  let adminEmail: string;
  let phoneNumber: string;
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
       VALUES ('Participant', 'Competition participant'), ('Admin', 'Administrator')
       ON CONFLICT (name) DO NOTHING`,
    );

    databaseChecked = true;
    originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = TEST_SECRET;
  });

  beforeEach(() => {
    email = `fpc13-${randomUUID()}@example.com`;
    adminEmail = `admin-${randomUUID()}@example.com`;
    phoneNumber = `+1999${randomInt(10_000_000).toString().padStart(7, "0")}`;
  });

  afterEach(async () => {
    if (databaseChecked) {
      await pool.query("UPDATE users SET is_active = false WHERE email IN ($1, $2)", [email, adminEmail]);
      emailCodes.clear();
      resetTokens.clear();
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
      role: "ADMIN",
    });

    expect(response.status).toBe(201);

    const raw = await response.json();
    const data = raw.data ?? raw;

    expect(data.user.id).toBeString();
    expect(data.accessToken).toBeUndefined();
    const pending = await post("login", { email, password: PASSWORD });
    expect(pending.status).toBe(401);
    expect(await pending.json()).toMatchObject({ message: "EMAIL_VERIFICATION_REQUIRED" });
    const wrongPassword = await post("login", { email, password: "Wrong-password-1!" });
    expect(wrongPassword.status).toBe(401);
    expect(await wrongPassword.json()).toMatchObject({ message: "Invalid email or password" });
    const code = emailCodes.get(email);
    const verification = await post("verify-email", { email, code });
    expect(verification.status).toBe(200);
    expect((await verification.json()).data.status).toBe("ACTIVE");
    expect((await post("verify-email", { email, code })).status).toBe(400);
    const login = await post("login", { email, password: PASSWORD });
    expect(login.status).toBe(200);
    return (await login.json()).data;
  }

  test("Đăng ký không cần số điện thoại, xác thực email và lưu hash refresh token sau đăng nhập", async () => {
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
      phoneNumber,
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
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(401);
  });

  async function adminSession() {
    const { rows } = await pool.query(
      "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      ["Test Admin", adminEmail, await Bun.password.hash(PASSWORD)],
    );
    await pool.query("INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = 'Admin'",
      [rows[0].id]);
    const login = await post("login", { email: adminEmail, password: PASSWORD });
    expect(login.status).toBe(200);
    return (await login.json()).data.accessToken as string;
  }

  test("Admin tạo tài khoản nội bộ chờ xác thực, Judge bị từ chối", async () => {
    const admin = await adminSession();
    await pool.query("INSERT INTO roles (name) VALUES ('Judge') ON CONFLICT DO NOTHING");
    const request = { email, fullName: "Test Judge", phoneNumber, temporaryPassword: PASSWORD, role: "JUDGE" };
    const response = await signedRequest("/users", admin, "POST", request);
    expect(response.status).toBe(201);
    expect((await response.json()).data).toMatchObject({ role: "Judge", status: "PENDING_VERIFICATION" });
    expect((await post("login", { email, password: PASSWORD })).status).toBe(401);
    expect((await post("verify-email", { email, code: emailCodes.get(email) })).status).toBe(200);
    const login = await post("login", { email, password: PASSWORD });
    const data = (await login.json()).data;
    expect(data.user.role).toBe("Judge");
    expect((await signedRequest("/users", data.accessToken, "POST", request)).status).toBe(403);
  });

  test("Logout đồng thời với refresh hủy toàn bộ phiên đang xoay vòng", async () => {
    const registered = await registerUser();
    const [rotation, logout] = await Promise.all([
      post("refresh", { refreshToken: registered.refreshToken }),
      post("logout", { refreshToken: registered.refreshToken }),
    ]);
    expect(logout.status).toBe(200);
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(401);
    if (rotation.status === 200) {
      const tokens = (await rotation.json()).data;
      expect((await signedRequest("/auth/me", tokens.accessToken)).status).toBe(401);
      expect((await post("refresh", { refreshToken: tokens.refreshToken })).status).toBe(401);
    } else {
      expect(rotation.status).toBe(401);
    }
  });

  test("Khóa và mở lại không khôi phục access hoặc refresh token cũ", async () => {
    const registered = await registerUser();
    const admin = await adminSession();
    const path = `/users/${registered.user.id}/status`;
    const lock = { status: "LOCKED", reason: "Tài khoản kiểm thử thu hồi phiên" };
    expect((await signedRequest(path, registered.accessToken, "PATCH", lock)).status).toBe(403);
    const listing = await signedRequest(`/users?role=PARTICIPANT&search=${encodeURIComponent(email)}`, admin);
    expect(listing.status).toBe(200);
    expect((await listing.json()).data.items).toHaveLength(1);
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(200);
    const [locked, refreshed] = await Promise.all([
      signedRequest(path, admin, "PATCH", lock),
      post("refresh", { refreshToken: registered.refreshToken }),
    ]);
    expect(locked.status).toBe(200);
    const lockedLogin = await post("login", { email, password: PASSWORD });
    expect(lockedLogin.status).toBe(403);
    expect(await lockedLogin.json()).toMatchObject({ message: "ACCOUNT_LOCKED", data: null });
    const invalidLogin = await post("login", { email, password: "Wrong-password-1!" });
    expect(invalidLogin.status).toBe(401);
    expect(await invalidLogin.json()).toMatchObject({ message: "Invalid email or password" });
    const refreshedTokens = refreshed.status === 200 ? (await refreshed.json()).data : null;
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(401);
    expect((await signedRequest(path, admin, "PATCH",
      { status: "ACTIVE", reason: "Mở lại sau kiểm thử thu hồi phiên" })).status).toBe(200);
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(401);
    expect((await post("refresh", { refreshToken: registered.refreshToken })).status).toBe(401);
    if (refreshedTokens) {
      expect((await signedRequest("/auth/me", refreshedTokens.accessToken)).status).toBe(401);
      expect((await post("refresh", { refreshToken: refreshedTokens.refreshToken })).status).toBe(401);
    }
    expect((await post("login", { email, password: PASSWORD })).status).toBe(200);
  });

  test("Sửa hồ sơ và đổi mật khẩu qua route Mobile, thu hồi phiên cũ", async () => {
    const registered = await registerUser();
    const { accessToken, refreshToken } = registered;
    expect((await signedRequest("/users/me/profile", accessToken, "PUT",
      { fullName: "Tên mới", bio: "Chụp ảnh phim" })).status).toBe(200);
    const me = await signedRequest("/users/me", accessToken);
    expect((await me.json()).data.user).toMatchObject({ fullName: "Tên mới", profile: { bio: "Chụp ảnh phim" } });
    const newPassword = "Changed@Password123";
    expect((await signedRequest("/users/me/password", accessToken, "PATCH",
      { currentPassword: PASSWORD, newPassword })).status).toBe(200);
    expect((await signedRequest("/auth/me", accessToken)).status).toBe(401);
    expect((await post("refresh", { refreshToken })).status).toBe(401);
    expect((await post("login", { email, password: newPassword })).status).toBe(200);
  });

  test("Reset mật khẩu dùng một lần và thu hồi phiên", async () => {
    const registered = await registerUser();
    const known = await post("forgot-password", { email });
    const unknown = await post("forgot-password", { email: "unknown@example.com" });
    expect(await known.json()).toEqual(await unknown.json());
    const token = resetTokens.get(email);
    expect(token).toBeString();
    const newPassword = "Reset@Password123";
    const body = { token, newPassword, confirmPassword: newPassword };
    expect((await post("reset-password", body)).status).toBe(200);
    expect((await post("reset-password", body)).status).toBe(400);
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(401);
    expect((await post("refresh", { refreshToken: registered.refreshToken })).status).toBe(401);
    expect((await post("login", { email, password: newPassword })).status).toBe(200);
  });

  test("Khóa tạm sau 5 lần sai và thu hồi phiên", async () => {
    const registered = await registerUser();
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await post("login", { email, password: "wrong password" })).status).toBe(401);
    }
    expect((await post("login", { email, password: PASSWORD })).status).toBe(401);
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(401);
    expect((await post("refresh", { refreshToken: registered.refreshToken })).status).toBe(401);
  });

  test("Admin đổi vai trò, thu hồi phiên cũ và áp dụng quyền mới", async () => {
    const registered = await registerUser();
    const admin = await adminSession();
    await pool.query("INSERT INTO roles (name) VALUES ('Organizer') ON CONFLICT DO NOTHING");
    const url = `/users/${registered.user.id}/role`;
    expect((await signedRequest("/rbac/manage-contest", registered.accessToken)).status).toBe(403);
    expect((await signedRequest(url, registered.accessToken, "PATCH", { role: "ADMIN" })).status).toBe(403);
    expect((await signedRequest(url, admin, "PATCH", { role: "CUSTOM" })).status).toBe(400);

    const before = await signedRequest(`/users?search=${encodeURIComponent(email)}&role=PARTICIPANT`, admin);
    expect(before.status).toBe(200);
    expect((await before.json()).data).toMatchObject({
      items: [{ id: registered.user.id, role: { code: "PARTICIPANT", name: "Participant" } }],
      totalRecords: 1,
    });
    const admins = await signedRequest(`/users?search=${encodeURIComponent(adminEmail)}`, admin);
    expect(admins.status).toBe(200);
    expect((await admins.json()).data.items[0].role).toEqual({ code: "ADMIN", name: "Admin" });

    const change = await signedRequest(url, admin, "PATCH", { role: "ORGANIZER" });
    expect(change.status).toBe(200);
    expect((await change.json()).data.role).toBe("Organizer");
    const after = await signedRequest(`/users?search=${encodeURIComponent(email)}&role=ORGANIZER`, admin);
    expect(after.status).toBe(200);
    expect((await after.json()).data).toMatchObject({
      items: [{ id: registered.user.id, role: { code: "ORGANIZER", name: "Organizer" } }],
      totalRecords: 1,
    });
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(401);
    expect((await post("refresh", { refreshToken: registered.refreshToken })).status).toBe(401);

    const nextLogin = await post("login", { email, password: PASSWORD });
    const next = (await nextLogin.json()).data;
    expect(next.user.role).toBe("Organizer");
    expect((await signedRequest("/rbac/manage-contest", next.accessToken)).status).toBe(200);
    expect((await signedRequest("/users", next.accessToken)).status).toBe(403);

    const audit = await pool.query(
      "SELECT changes FROM account_audit_logs WHERE account_id = $1 AND action = 'ACCOUNT_ROLE_CHANGED'",
      [registered.user.id],
    );
    expect(audit.rows[0]?.changes).toEqual({ previous: ["Participant"], current: "Organizer" });
  });

  test("Admin xem bốn vai trò với quyền cố định", async () => {
    const registered = await registerUser();
    const admin = await adminSession();
    const response = await signedRequest("/rbac/roles", admin);
    expect(response.status).toBe(200);
    const roles = (await response.json()).data;
    expect(roles).toHaveLength(4);
    expect(roles.find(({ role }: { role: string }) => role === "Participant").permissions)
      .toContain("users:read_own_profile");
    expect((await signedRequest("/rbac/roles/Participant/permissions", admin, "PUT", {
      permissions: [],
    })).status).toBe(404);
    expect((await signedRequest("/auth/me", registered.accessToken)).status).toBe(200);
  });
});
