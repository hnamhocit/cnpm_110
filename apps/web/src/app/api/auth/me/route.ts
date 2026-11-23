import { cookies } from "next/headers";

import { REFRESH_COOKIE } from "@/lib/auth-cookie-options";
import { setAuthCookies } from "@/lib/auth-cookies";
import { API_INTERNAL_URL } from "@/lib/server-api";

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("access_token")?.value;

  // Nếu không có access_token hoặc vừa F5, thử khôi phục từ refresh_token
  if (!accessToken) {
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_INTERNAL_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        });
        if (refreshRes.ok) {
          // biome-ignore lint/suspicious/noExplicitAny: unwrap
          const rawData = (await refreshRes.json().catch(() => ({}))) as any;
          const data =
            rawData?.data && typeof rawData.data === "object"
              ? rawData.data
              : rawData;
          const newAccess = data?.accessToken ?? rawData?.accessToken;
          const newRefresh =
            data?.refreshToken ?? rawData?.refreshToken ?? refreshToken;
          if (newAccess) {
            accessToken = newAccess;
            await setAuthCookies(newAccess, newRefresh);
          }
        }
      } catch {
        // refresh failed
      }
    }
  }

  if (!accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    let response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    // Nếu token hết hạn (401), tự động silent-refresh và thử lại
    if (response.status === 401) {
      const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
      if (refreshToken) {
        const refreshRes = await fetch(`${API_INTERNAL_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        });
        if (refreshRes.ok) {
          // biome-ignore lint/suspicious/noExplicitAny: unwrap
          const rawData = (await refreshRes.json().catch(() => ({}))) as any;
          const data =
            rawData?.data && typeof rawData.data === "object"
              ? rawData.data
              : rawData;
          const newAccess = data?.accessToken ?? rawData?.accessToken;
          const newRefresh =
            data?.refreshToken ?? rawData?.refreshToken ?? refreshToken;
          if (newAccess) {
            accessToken = newAccess;
            await setAuthCookies(newAccess, newRefresh);
            response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
              headers: { Authorization: `Bearer ${newAccess}` },
              cache: "no-store",
            });
          }
        }
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
    const user = rawData?.data?.user ?? rawData?.data ?? rawData?.user ?? rawData;
    return Response.json({ user });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
