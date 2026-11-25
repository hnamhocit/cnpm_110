export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

// Refresh token chỉ gửi tới các route BFF /api/auth, không lộ cho JS.
export const REFRESH_COOKIE_PATH = "/api/auth";

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

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60,
  };
}
