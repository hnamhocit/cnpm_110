import { setAuthCookies } from "@/lib/auth-cookies";
import { clearRefreshCache } from "@/lib/auth-tokens";
import { API_INTERNAL_URL } from "@/lib/server-api";

type LoginBody = { email?: unknown; password?: unknown };

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: unknown;
  error?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json(
      { error: "Vui lòng nhập email và mật khẩu." },
      { status: 400 },
    );
  }

  const response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  // biome-ignore lint/suspicious/noExplicitAny: response unwrap
  const rawData = (await response.json().catch(() => ({}))) as any;
  const data = (
    rawData?.data && typeof rawData.data === "object" ? rawData.data : rawData
  ) as LoginResponse;
  const accessToken = data?.accessToken ?? rawData?.accessToken;
  const refreshToken = data?.refreshToken ?? rawData?.refreshToken;
  const user = data?.user ?? rawData?.user;

  if (!response.ok || !accessToken || !refreshToken) {
    return Response.json(
      {
        error:
          data?.error ??
          rawData?.error ??
          rawData?.message ??
          "Đăng nhập thất bại.",
      },
      { status: response.ok ? 502 : response.status },
    );
  }

  clearRefreshCache();
  await setAuthCookies(accessToken, refreshToken);

  return Response.json({ accessToken, user });
}
