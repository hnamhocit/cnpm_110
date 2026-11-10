import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  accessCookieOptions,
  REFRESH_COOKIE,
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
