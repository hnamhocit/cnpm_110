import type { Context } from "hono";
import { UUID_PATTERN, type AuthEnv } from "../middlewares/auth";
import {
  changeAccountPassword,
  getCurrentUser,
  listAccounts,
  getUserPortfolio,
  loginUser,
  logoutUser,
  refreshUserTokens,
  updateAccountProfile,
  updateAccountRole,
  updateAccountStatus,
} from "../services/auth.service";
import { identityDelivery, type IdentityDelivery } from "../services/identity-delivery";
import {
  createPendingAccount,
  requestPasswordReset,
  resendAccountVerification,
  resetAccountPassword,
  verifyAccountEmail,
} from "../services/identity.service";
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

function normalizeEmail(value: unknown) {
  const email = boundedString(value, "email", 255, 1).toLowerCase();
  if (!EMAIL_REGEX.test(email)) throw AppError.badRequest("Invalid email address");
  return email;
}

function normalizePhone(value: unknown) {
  const phone = boundedString(value, "phoneNumber", 16, 1);
  const canonical = /^0[1-9][0-9]{8}$/.test(phone) ? `+84${phone.slice(1)}` : phone;
  if (!/^\+[1-9][0-9]{7,14}$/.test(canonical)) throw AppError.badRequest("Invalid phone number");
  return canonical;
}

function validatePassword(value: unknown) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128 ||
      !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value) ||
      !/[^A-Za-z0-9\s]/.test(value)) {
    throw AppError.badRequest("Password requires 8–128 characters, uppercase, lowercase, a number and a symbol");
  }
  return value;
}

function accountInput(body: Record<string, unknown>, password: unknown) {
  const email = normalizeEmail(body.email);
  const validated = validatePassword(password);
  const prefix = email.split("@")[0];
  if (prefix.length >= 3 && validated.toLowerCase().includes(prefix)) {
    throw AppError.badRequest("Password cannot contain the email prefix");
  }
  return {
    fullName: boundedString(body.fullName, "fullName", 100, 2),
    email,
    phoneNumber: body.phoneNumber == null ? undefined : normalizePhone(body.phoneNumber),
    password: validated,
  };
}

export function identityHandlers(delivery: IdentityDelivery = identityDelivery) {
  return {
    async register(c: Context) {
      const body = await parseJsonBody(c);
      const result = await createPendingAccount({ ...accountInput(body, body.password), role: "Participant" }, delivery);
      return c.created(result, "Account created and pending verification");
    },
    async createInternal(c: Context<AuthEnv>) {
      const body = await parseJsonBody(c);
      const role = { ADMIN: "Admin", ORGANIZER: "Organizer", JUDGE: "Judge" } as const;
      if (body.role !== "ADMIN" && body.role !== "ORGANIZER" && body.role !== "JUDGE") {
        throw AppError.badRequest("Invalid internal role");
      }
      const result = await createPendingAccount({
        ...accountInput(body, body.temporaryPassword), role: role[body.role],
      }, delivery, c.get("user").id);
      return c.created({ ...result.user, status: result.status, deliveryStatus: result.deliveryStatus });
    },
    async verifyEmail(c: Context) {
      const body = await parseJsonBody(c);
      return c.ok(await verifyAccountEmail(normalizeEmail(body.email), verificationCode(body.code)));
    },
    async resendVerification(c: Context) {
      const body = await parseJsonBody(c);
      const password = boundedPassword(body.password);
      return c.ok(await resendAccountVerification(normalizeEmail(body.email), password, delivery));
    },
    async forgotPassword(c: Context) {
      const body = await parseJsonBody(c);
      await requestPasswordReset(normalizeEmail(body.email), delivery);
      return c.ok(null, "If this account has a verified email, password reset instructions will be sent.");
    },
    async resetPassword(c: Context) {
      const body = await parseJsonBody(c);
      const token = boundedString(body.token, "token", 43, 43);
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw AppError.badRequest("Invalid reset token");
      const newPassword = validatePassword(body.newPassword);
      if (newPassword !== body.confirmPassword) throw AppError.badRequest("Password confirmation does not match");
      await resetAccountPassword(token, newPassword);
      return c.ok(null, "Password reset. Please sign in again.");
    },
  };
}

function verificationCode(value: unknown) {
  if (typeof value !== "string" || !/^[0-9]{6}$/.test(value)) {
    throw AppError.badRequest("Verification code must contain six digits");
  }
  return value;
}

function boundedPassword(value: unknown) {
  if (typeof value !== "string" || !value.length || value.length > 128) {
    throw AppError.badRequest("Invalid password");
  }
  return value;
}

export async function handleLogin(c: Context) {
  const body = await parseJsonBody<{
    email?: unknown;
    password?: unknown;
  }>(c);

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || email.length > 255 || !password || password.length > 128) {
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

function boundedString(value: unknown, field: string, max: number, min = 0) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) {
    throw AppError.badRequest(`Invalid ${field}`);
  }
  return value.trim();
}

function httpsUrl(value: unknown, field: string) {
  const url = boundedString(value, field, 255);
  if (url && !URL.canParse(url)) throw AppError.badRequest(`Invalid ${field}`);
  if (url && !["https:", "http:"].includes(new URL(url).protocol)) {
    throw AppError.badRequest(`Invalid ${field}`);
  }
  return url;
}

export async function handleUpdateProfile(c: Context<AuthEnv>) {
  const body = await parseJsonBody(c);
  const fullName = body.fullName === undefined ? undefined
    : boundedString(body.fullName, "fullName", 100, 1);
  const avatarUrl = body.avatarUrl === undefined || body.avatarUrl === null
    ? body.avatarUrl : httpsUrl(body.avatarUrl, "avatarUrl");
  const profile: Record<string, unknown> = {};
  for (const [field, limit] of Object.entries({
    displayName: 100, bio: 1000, instagramHandle: 100, addressCity: 100,
  })) {
    if (body[field] !== undefined) profile[field] = boundedString(body[field], field, limit);
  }
  for (const [field, values] of Object.entries({
    experienceLevel: ["NOVICE", "AMATEUR", "ENTHUSIAST", "PROFESSIONAL"],
    primaryFilmFormat: ["35MM", "120_MEDIUM_FORMAT", "LARGE_FORMAT", "MULTIPLE"],
  })) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value !== "string" || !values.includes(value)) {
      throw AppError.badRequest(`Invalid ${field}`);
    }
    profile[field] = value;
  }
  if (body.portfolioWebsite !== undefined) {
    profile.portfolioWebsite = httpsUrl(body.portfolioWebsite, "portfolioWebsite");
  }
  if (body.favoriteFilmStocks !== undefined) {
    if (!Array.isArray(body.favoriteFilmStocks) || body.favoriteFilmStocks.length > 10) {
      throw AppError.badRequest("Invalid favoriteFilmStocks");
    }
    profile.favoriteFilmStocks = body.favoriteFilmStocks.map((item) =>
      boundedString(item, "favoriteFilmStocks", 100, 1));
  }
  if (fullName === undefined && avatarUrl === undefined && !Object.keys(profile).length) {
    throw AppError.badRequest("No profile fields to update");
  }
  const actor = c.get("user");
  const updated = await updateAccountProfile(actor.id, { fullName, avatarUrl, profile });
  return c.ok({ updatedAt: updated.updatedAt }, "Profile updated");
}

export async function handleChangePassword(c: Context<AuthEnv>) {
  const { currentPassword, newPassword } = await parseJsonBody(c);
  const previous = boundedPassword(currentPassword);
  const next = validatePassword(newPassword);
  if (previous === next) throw AppError.badRequest("New password must be different");
  await changeAccountPassword(c.get("user").id, previous, next);
  return c.ok(null, "Password changed. Please sign in again.");
}

export async function handleUpdateAccountStatus(c: Context<AuthEnv>) {
  const userId = c.req.param("id") ?? "";
  if (!UUID_PATTERN.test(userId)) throw AppError.badRequest("Invalid account id");
  const { status, reason } = await parseJsonBody(c);
  if (status !== "ACTIVE" && status !== "LOCKED" && status !== "BANNED") {
    throw AppError.badRequest("Invalid account status");
  }
  return c.ok(await updateAccountStatus(
    c.get("user").id, userId, status, boundedString(reason, "reason", 500, 10),
  ));
}

export async function handleUpdateAccountRole(c: Context<AuthEnv>) {
  const userId = c.req.param("id") ?? "";
  if (!UUID_PATTERN.test(userId)) throw AppError.badRequest("Invalid account id");
  const { role } = await parseJsonBody(c);
  const roles = { ADMIN: "Admin", ORGANIZER: "Organizer", JUDGE: "Judge", PARTICIPANT: "Participant" } as const;
  if (role !== "ADMIN" && role !== "ORGANIZER" && role !== "JUDGE" && role !== "PARTICIPANT") {
    throw AppError.badRequest("Invalid account role");
  }
  return c.ok(await updateAccountRole(c.get("user").id, userId, roles[role]));
}

export async function handleListAccounts(c: Context<AuthEnv>) {
  const page = Number(c.req.query("page") ?? 1);
  const limit = Number(c.req.query("limit") ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw AppError.badRequest("Invalid pagination");
  }
  const status = c.req.query("status");
  if (status !== undefined && status !== "ACTIVE" && status !== "LOCKED" && status !== "BANNED" && status !== "PENDING_VERIFICATION") {
    throw AppError.badRequest("Invalid account status");
  }
  const role = c.req.query("role")?.toUpperCase();
  if (role && !["ADMIN", "ORGANIZER", "JUDGE", "PARTICIPANT"].includes(role)) {
    throw AppError.badRequest("Invalid role");
  }
  const search = boundedString(c.req.query("search") ?? "", "search", 255);
  return c.ok(await listAccounts({ page, limit, status, role, search }));
}
