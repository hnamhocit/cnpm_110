import { cookies } from "next/headers";

import { REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { clearAuthCookies } from "@/lib/auth-cookies";
import { clearRefreshCache } from "@/lib/auth-tokens";
import { API_INTERNAL_URL } from "@/lib/server-api";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  // BR-04: thu hồi refresh token phía server trước khi xoá cookie.
  if (refreshToken) {
    await fetch(`${API_INTERNAL_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }

  await clearAuthCookies();
  clearRefreshCache();

  return Response.json({ success: true, message: "Logged out successfully" });
}
