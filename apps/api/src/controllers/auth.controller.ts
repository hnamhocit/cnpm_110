import type { Context } from "hono";
import type { AuthEnv } from "../middlewares/auth";
import {
  getCurrentUser,
  getUserPortfolio,
  loginUser,
  logoutUser,
  refreshUserTokens,
  registerUser,
} from "../services/auth.service";
import { AppError } from "../utils/errors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function parseJsonBody<T extends Record<string, unknown>>(
  c: Context,
): Promise<T> {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw AppError.badRequest("Invalid JSON body");
    }
    return body as T;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.badRequest("Invalid JSON body");
  }
}

export async function handleRegister(c: Context) {
  const body = await parseJsonBody<{
    fullName?: unknown;
    email?: unknown;
    password?: unknown;
  }>(c);

  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!fullName || fullName.length > 100) {
    throw AppError.badRequest(
      "Full name is required and must be at most 100 characters",
    );
  }

  if (!EMAIL_REGEX.test(email) || email.length > 255) {
    throw AppError.badRequest("Invalid email address");
  }

  if (password.length < 8 || password.length > 128) {
    throw AppError.badRequest("Password must be between 8 and 128 characters");
  }

  const result = await registerUser({ fullName, email, password });
  return c.created(result, "Registration successful");
}

export async function handleLogin(c: Context) {
  const body = await parseJsonBody<{
    email?: unknown;
    password?: unknown;
  }>(c);

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    throw AppError.badRequest("Email and password are required");
  }

  const result = await loginUser({ email, password });
  return c.ok(result, "Login successful");
}

export async function handleRefresh(c: Context) {
  const body = await parseJsonBody<{ refreshToken?: unknown }>(c);
  const oldToken =
    typeof body.refreshToken === "string" ? body.refreshToken : "";

  if (!oldToken) {
    throw AppError.badRequest("Refresh token is required");
  }

  const tokens = await refreshUserTokens(oldToken);
  return c.ok(tokens, "Token refreshed successfully");
}

export async function handleLogout(c: Context) {
  const body = await parseJsonBody<{ refreshToken?: unknown }>(c);
  const refreshToken =
    typeof body.refreshToken === "string" ? body.refreshToken : "";

  if (!refreshToken) {
    throw AppError.badRequest("Refresh token is required");
  }

  await logoutUser(refreshToken);
  return c.ok(null, "Logout successful");
}

export async function handleGetMe(c: Context<AuthEnv>) {
  const authUser = c.get("user");
  const user = await getCurrentUser(authUser.id);
  return c.ok({ user });
}

export async function handleGetPortfolio(c: Context<AuthEnv>) {
  const authUser = c.get("user");
  const portfolio = await getUserPortfolio(authUser.id);
  return c.ok(portfolio, "User portfolio retrieved successfully");
}
