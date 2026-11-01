import { setAuthCookies } from "@/lib/auth-cookies";
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

  const response = await fetch(`${API_INTERNAL_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as LoginResponse;

  if (!response.ok || !data.accessToken || !data.refreshToken) {
    return Response.json(
      { error: data.error ?? "Đăng nhập thất bại." },
      { status: response.ok ? 502 : response.status },
    );
  }

  await setAuthCookies(data.accessToken, data.refreshToken);

  return Response.json({ accessToken: data.accessToken, user: data.user });
}
