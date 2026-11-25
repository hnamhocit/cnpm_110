import { cookies } from "next/headers";

import { REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { setAuthCookies } from "@/lib/auth-cookies";
import { refreshAuthTokens } from "@/lib/auth-tokens";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return Response.json({ accessToken: null }, { status: 401 });
  }

  const tokens = await refreshAuthTokens(refreshToken);

  if (!tokens) {
    return Response.json({ accessToken: null }, { status: 401 });
  }

  await setAuthCookies(tokens.accessToken, tokens.refreshToken);

  return Response.json({ accessToken: tokens.accessToken });
}
