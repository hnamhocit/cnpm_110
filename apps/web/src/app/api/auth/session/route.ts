import { cookies } from "next/headers";

import { REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { setAuthCookies } from "@/lib/auth-cookies";
import { API_INTERNAL_URL } from "@/lib/server-api";

type RefreshResponse = {
  accessToken?: string;
  refreshToken?: string;
};

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return Response.json({ accessToken: null }, { status: 401 });
  }

  const response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  // biome-ignore lint/suspicious/noExplicitAny: response unwrap
  const rawData = (await response.json().catch(() => ({}))) as any;
  const data = (rawData?.data && typeof rawData.data === "object" ? rawData.data : rawData) as RefreshResponse;
  const accessToken = data?.accessToken ?? rawData?.accessToken;
  const newRefreshToken = data?.refreshToken ?? rawData?.refreshToken ?? refreshToken;

  if (!response.ok || !accessToken) {
    return Response.json({ accessToken: null }, { status: 401 });
  }

  await setAuthCookies(accessToken, newRefreshToken);

  return Response.json({ accessToken });
}
