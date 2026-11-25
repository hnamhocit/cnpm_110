import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  accessCookieOptions,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  refreshCookieOptions,
} from "./auth-cookie-options";

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
  store.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();

  store.delete({ name: ACCESS_COOKIE, path: "/" });
  store.delete({ name: REFRESH_COOKIE, path: REFRESH_COOKIE_PATH });
  // Dọn cookie cũ từ các phiên bản trước nếu còn tồn tại.
  store.delete({ name: REFRESH_COOKIE, path: "/api/auth" });
  store.delete({ name: REFRESH_COOKIE, path: "/" });
}
