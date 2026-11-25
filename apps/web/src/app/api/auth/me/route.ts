import { cookies } from "next/headers";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { setAuthCookies } from "@/lib/auth-cookies";
import { refreshAuthTokens } from "@/lib/auth-tokens";
import { API_INTERNAL_URL } from "@/lib/server-api";

async function fetchMe(accessToken: string) {
  return fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

// Đổi refresh token HttpOnly lấy access token mới và ghi lại cookie.
// Trả về access token mới, hoặc null nếu refresh thất bại.
async function tryRefresh(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) return null;

  const tokens = await refreshAuthTokens(refreshToken);
  if (!tokens) return null;

  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value ?? null;

  if (!accessToken) {
    accessToken = await tryRefresh();
  }

  if (!accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    let response = await fetchMe(accessToken);

    // Access token hết hạn: silent-refresh rồi thử lại một lần.
    if (response.status === 401) {
      const refreshedToken = await tryRefresh();
      if (refreshedToken) {
        accessToken = refreshedToken;
        response = await fetchMe(accessToken);
      }
    }

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch user data" },
        { status: response.status },
      );
    }

    // biome-ignore lint/suspicious/noExplicitAny: response unwrap
    const rawData = (await response.json().catch(() => ({}))) as any;
    const user =
      rawData?.data?.user ?? rawData?.data ?? rawData?.user ?? rawData;
    return Response.json({ user });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
