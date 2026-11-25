import { cookies } from "next/headers";

import { REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { clearAuthCookies } from "@/lib/auth-cookies";
import { clearRefreshCache } from "@/lib/auth-tokens";
import { API_INTERNAL_URL } from "@/lib/server-api";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  // BR-04: thu hồi refresh token phía backend trước khi xóa cookie.
  if (refreshToken) {
    await fetch(`${API_INTERNAL_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => null);
  }

  clearRefreshCache();
  await clearAuthCookies();

  return Response.json({ success: true, message: "Logged out successfully" });
}
