export const ACCESS_COOKIE = "access_token";
// SRS Module 01 §4.2: cookie `refreshToken` scope /api/v1/auth, SameSite=Strict.
export const REFRESH_COOKIE = "refreshToken";
export const REFRESH_COOKIE_PATH = "/api/v1/auth";

const isProduction = process.env.NODE_ENV === "production";

export function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 15 * 60,
  };
}

// Refresh token chỉ gửi tới các route /api/v1/auth, không lộ cho JS.
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60,
  };
}
