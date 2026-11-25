import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { clearAuthCookies } from "@/lib/auth-cookies";
import { clearRefreshCache } from "@/lib/auth-tokens";
import { API_INTERNAL_URL } from "@/lib/server-api";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  // BR-04: thu hồi refresh token phía backend trước khi xóa cookie.
  if (refreshToken) {
    const result = await fetch(`${API_INTERNAL_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (!result?.ok) {
      return Response.json({ success: false }, { status: 502 });
    }
  }

  clearRefreshCache();
  await clearAuthCookies();

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
  // NextResponse.cookies indexes by name, so append the legacy path separately.
  response.headers.append("Set-Cookie", `${REFRESH_COOKIE}=; Path=/; Max-Age=0`);

  return response;
}
