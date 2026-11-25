import { type NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth-cookie-options";
import { isTokenExpiring } from "@/lib/auth-tokens";

// Silent refresh: nếu access token thiếu/hết hạn, chuyển qua route handler
// /api/v1/auth/refresh (nơi đọc được refresh token HttpOnly) rồi quay lại.
export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  if (accessToken && !isTokenExpiring(accessToken)) {
    return NextResponse.next();
  }

  const refreshUrl = new URL("/api/v1/auth/refresh", request.url);
  refreshUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(refreshUrl);
}

export const config = {
  matcher: ["/portal/:path*"],
};
