import { Hono } from "hono";
import { sign } from "hono/jwt";
import { createHash, randomBytes } from "node:crypto";
import { pool } from "../db";
import type { Role } from "../middlewares/auth";

const auth = new Hono();

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 7;

function getJwtSecret(): string {
  const secret = Bun.env.JWT_SECRET;

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

async function createAccessToken(id: string, role: Role) {
  const now = Math.floor(Date.now() / 1000);

  return sign(
    {
      id,
      role,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    },
    getJwtSecret(),
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRole(value: string): value is Role {
  return ["Admin", "Organizer", "Judge", "Participant"].includes(value);
}

async function saveRefreshToken(userId: string, token: string) {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 day'))`,
    [userId, hashToken(token), REFRESH_TOKEN_TTL_DAYS],
  );
}

async function issueTokens(userId: string, role: Role) {
  const accessToken = await createAccessToken(userId, role);
  const refreshToken = createRefreshToken();

  await saveRefreshToken(userId, refreshToken);

  return { accessToken, refreshToken };
}

// POST /auth/register
auth.post("/register", async (c) => {
  let body: {
    fullName?: unknown;
    email?: unknown;
    password?: unknown;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!fullName || fullName.length > 100) {
    return c.json(
      { error: "Full name is required and must be at most 100 characters" },
      400,
    );
  }

  if (!isValidEmail(email) || email.length > 255) {
    return c.json({ error: "Invalid email address" }, 400);
  }

  if (password.length < 8 || password.length > 128) {
    return c.json(
      { error: "Password must be between 8 and 128 characters" },
      400,
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [email],
    );

    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return c.json({ error: "Email is already registered" }, 409);
    }

    const roleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'Participant'",
    );

    if (!roleResult.rowCount) {
      await client.query("ROLLBACK");
      console.error("Participant role is missing from the database");
      return c.json({ error: "Registration is temporarily unavailable" }, 500);
    }

    const passwordHash = await Bun.password.hash(password);

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email, created_at`,
      [fullName, email, passwordHash],
    );

    const user = userResult.rows[0];

    await client.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [user.id, roleResult.rows[0].id],
    );

    const accessToken = await createAccessToken(user.id, "Participant");
    const refreshToken = createRefreshToken();

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 day'))`,
      [user.id, hashToken(refreshToken), REFRESH_TOKEN_TTL_DAYS],
    );

    await client.query("COMMIT");

    return c.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: "Participant",
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
      },
      201,
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors if the transaction has already ended.
    }

    console.error("Registration failed:", error);
    return c.json({ error: "Registration failed" }, 500);
  } finally {
    client.release();
  }
});

// POST /auth/login
auth.post("/login", async (c) => {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active,
              r.name AS role
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE LOWER(u.email) = $1
       ORDER BY CASE r.name
         WHEN 'Admin' THEN 1
         WHEN 'Organizer' THEN 2
         WHEN 'Judge' THEN 3
         WHEN 'Participant' THEN 4
         ELSE 5
       END
       LIMIT 1`,
      [email],
    );

    if (!result.rowCount) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return c.json({ error: "Account is inactive" }, 403);
    }

    const passwordMatches = await Bun.password.verify(
      password,
      user.password_hash,
    );

    if (!passwordMatches) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    if (!isRole(user.role)) {
      return c.json({ error: "Invalid user role" }, 403);
    }

    const tokens = await issueTokens(user.id, user.role);

    return c.json({
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// POST /auth/refresh
auth.post("/refresh", async (c) => {
  let body: { refreshToken?: unknown };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const oldToken =
    typeof body.refreshToken === "string" ? body.refreshToken : "";

  if (!oldToken) {
    return c.json({ error: "Refresh token is required" }, 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT rt.id, rt.user_id, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
         AND rt.revoked_at IS NULL
         AND rt.expires_at > NOW()
       FOR UPDATE OF rt`,
      [hashToken(oldToken)],
    );

    if (!tokenResult.rowCount || !tokenResult.rows[0].is_active) {
      await client.query("ROLLBACK");
      return c.json({ error: "Invalid or expired refresh token" }, 401);
    }

    const tokenRow = tokenResult.rows[0];

    const roleResult = await client.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY CASE r.name
         WHEN 'Admin' THEN 1
         WHEN 'Organizer' THEN 2
         WHEN 'Judge' THEN 3
         WHEN 'Participant' THEN 4
         ELSE 5
       END
       LIMIT 1`,
      [tokenRow.user_id],
    );

    if (!roleResult.rowCount || !isRole(roleResult.rows[0].name)) {
      await client.query("ROLLBACK");
      return c.json({ error: "User role not found or invalid" }, 403);
    }

    const role: Role = roleResult.rows[0].name;

    await client.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1",
      [tokenRow.id],
    );

    const accessToken = await createAccessToken(tokenRow.user_id, role);
    const refreshToken = createRefreshToken();

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 day'))`,
      [tokenRow.user_id, hashToken(refreshToken), REFRESH_TOKEN_TTL_DAYS],
    );

    await client.query("COMMIT");

    return c.json({ accessToken, refreshToken });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors if the transaction has already ended.
    }

    console.error("Token refresh failed:", error);
    return c.json({ error: "Token refresh failed" }, 500);
  } finally {
    client.release();
  }
});

// POST /auth/logout
auth.post("/logout", async (c) => {
  let body: { refreshToken?: unknown };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const refreshToken =
    typeof body.refreshToken === "string" ? body.refreshToken : "";

  if (!refreshToken) {
    return c.json({ error: "Refresh token is required" }, 400);
  }

  try {
    await pool.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [hashToken(refreshToken)],
    );

    return c.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout failed:", error);
    return c.json({ error: "Logout failed" }, 500);
  }
});

export default auth;
