import { type NextRequest, NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  accessCookieOptions,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  refreshCookieOptions,
} from "@/lib/auth-cookie-options";
import { refreshAuthTokens } from "@/lib/auth-tokens";

const DEFAULT_NEXT = "/portal";

// Chỉ cho phép quay lại chính origin hiện tại và trong /portal (chống open redirect).
function safeNext(value: string | null, requestUrl: URL): string {
  if (!value) return DEFAULT_NEXT;

  try {
    const target = new URL(value, requestUrl);
    if (target.origin !== requestUrl.origin) return DEFAULT_NEXT;
    if (
      target.pathname !== "/portal" &&
      !target.pathname.startsWith("/portal/")
    ) {
      return DEFAULT_NEXT;
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return DEFAULT_NEXT;
  }
}

function clearSessionCookies(response: NextResponse): NextResponse {
  response.cookies.delete({ name: ACCESS_COOKIE, path: "/" });
  response.cookies.delete({
    name: REFRESH_COOKIE,
    path: REFRESH_COOKIE_PATH,
  });
  // Dọn cookie tên cũ nếu còn sót.
  response.cookies.delete({ name: "refresh_token", path: "/api/auth" });
  response.cookies.delete({ name: "refresh_token", path: "/" });
  return response;
}

// GET dùng cho redirect từ proxy khi access token hết hạn (silent refresh).
export async function GET(request: NextRequest) {
  const next = safeNext(
    request.nextUrl.searchParams.get("next"),
    request.nextUrl,
  );
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return clearSessionCookies(
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  const tokens = await refreshAuthTokens(refreshToken);
  if (!tokens) {
    return clearSessionCookies(
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(
    ACCESS_COOKIE,
    tokens.accessToken,
    accessCookieOptions(),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    refreshCookieOptions(),
  );
  return response;
}
