import { cookies } from "next/headers";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { refreshAuthTokens } from "@/lib/auth-tokens";
import { API_INTERNAL_URL } from "@/lib/server-api";

async function fetchMe(accessToken: string): Promise<Response> {
  return fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

function unauthorized() {
  return Response.json({ error: "Not authenticated" }, { status: 401 });
}

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  let refreshed = false;

  // Mất access token nhưng còn refresh token: khôi phục phiên.
  if (!accessToken) {
    if (!refreshToken) return unauthorized();

    const tokens = await refreshAuthTokens(refreshToken);
    if (!tokens) {
      await clearAuthCookies();
      return unauthorized();
    }

    accessToken = tokens.accessToken;
    refreshed = true;
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  }

  let response = await fetchMe(accessToken);

  // Access token hết hạn: silent-refresh bằng refresh token HttpOnly rồi thử lại.
  // Chỉ refresh tối đa một lần (backend rotate token nên không dùng lại token cũ).
  if (response.status === 401 && !refreshed && refreshToken) {
    const tokens = await refreshAuthTokens(refreshToken);
    if (!tokens) {
      await clearAuthCookies();
      return unauthorized();
    }

    accessToken = tokens.accessToken;
    refreshed = true;
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);
    response = await fetchMe(accessToken);
  }

  if (!response.ok) {
    // Không còn khả năng khôi phục: xoá cookie để client không lặp vô hạn.
    if (response.status === 401) {
      await clearAuthCookies();
    }
    return Response.json(
      { error: "Failed to fetch user data" },
      { status: response.status },
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: response unwrap
  const rawData = (await response.json().catch(() => ({}))) as any;
  const user = rawData?.data?.user ?? rawData?.data ?? rawData?.user ?? rawData;
  return Response.json({ user });
}
