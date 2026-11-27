import { cookies } from "next/headers";

import { REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { setAuthCookies } from "@/lib/auth-cookies";
import { refreshSession } from "@/lib/refresh-session";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return Response.json({ accessToken: null }, { status: 401 });

  try {
    const tokens = await refreshSession(refreshToken);
    if (!tokens) return Response.json({ accessToken: null }, { status: 401 });
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);
    return Response.json({ accessToken: tokens.accessToken });
  } catch {
    return Response.json({ error: "Authentication service unavailable" }, { status: 502 });
  }
}
