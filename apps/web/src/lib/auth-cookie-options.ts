export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

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

// Refresh token chỉ gửi tới các route /api/auth, không lộ cho JS.
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60,
  };
}
