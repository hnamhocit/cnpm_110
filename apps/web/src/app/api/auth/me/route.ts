import { cookies } from "next/headers";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { setAuthCookies } from "@/lib/auth-cookies";
import { refreshSession } from "@/lib/refresh-session";
import { API_INTERNAL_URL } from "@/lib/server-api";

export async function GET() {
  const store = await cookies();
  let accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  const getUser = (token: string) => fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  try {
    let response = accessToken ? await getUser(accessToken) : null;
    if ((!response || response.status === 401) && refreshToken) {
      const tokens = await refreshSession(refreshToken);
      if (tokens) {
        accessToken = tokens.accessToken;
        await setAuthCookies(tokens.accessToken, tokens.refreshToken);
        response = await getUser(tokens.accessToken);
      }
    }
    if (!response) return Response.json({ error: "Not authenticated" }, { status: 401 });
    if (!response.ok) {
      return Response.json({ error: "Failed to fetch user data" }, { status: response.status });
    }
    const raw = await response.json();
    return Response.json({ user: raw.data?.user ?? raw.data ?? raw.user ?? raw });
  } catch {
    return Response.json({ error: "Authentication service unavailable" }, { status: 502 });
  }
}
