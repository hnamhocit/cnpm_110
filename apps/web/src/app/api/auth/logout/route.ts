import { type NextRequest, NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  accessCookieOptions,
  REFRESH_COOKIE,
  refreshCookieOptions,
} from "@/lib/auth-cookie-options";
import { clearRefreshCache } from "@/lib/auth-tokens";
import { API_INTERNAL_URL } from "@/lib/server-api";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

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

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
  response.cookies.set(ACCESS_COOKIE, "", {
    ...accessCookieOptions(),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE, "", {
    ...refreshCookieOptions(),
    maxAge: 0,
  });

  // NextResponse.cookies indexes by name, so append the legacy path separately.
  response.headers.append(
    "Set-Cookie",
    `${REFRESH_COOKIE}=; Path=/; Max-Age=0`,
  );

  return response;
}
