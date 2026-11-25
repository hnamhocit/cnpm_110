import { API_INTERNAL_URL } from "./server-api";

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

type JwtPayload = {
  role?: string;
  exp?: number;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

// Refresh trước 30 giây để tránh token hết hạn giữa request.
export function isTokenExpiring(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

// Backend rotate refresh token sau mỗi lần refresh. Nếu hai request đồng thời
// (Header, axios interceptor, proxy...) cùng refresh bằng một token, request đến
// sau sẽ dùng token đã bị thu hồi và làm người dùng bị đăng xuất oan.
// - Gộp các lần refresh đang chạy cho cùng token thành một promise.
// - Giữ kết quả trong một khoảng grace ngắn để request tới trễ vẫn nhận cùng cặp token.
const REFRESH_GRACE_MS = 5_000;
const inFlightRefreshes = new Map<string, Promise<AuthTokenPair | null>>();
const recentRefreshes = new Map<
  string,
  { tokens: AuthTokenPair; expiresAt: number }
>();

function pruneRecentRefreshes() {
  const now = Date.now();
  for (const [token, entry] of recentRefreshes) {
    if (entry.expiresAt <= now) recentRefreshes.delete(token);
  }
}

// Gọi khi đăng xuất để không tái sử dụng cặp token vừa bị thu hồi.
export function clearRefreshCache(): void {
  recentRefreshes.clear();
}

export function refreshAuthTokens(
  refreshToken: string,
): Promise<AuthTokenPair | null> {
  const cached = recentRefreshes.get(refreshToken);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.tokens);
  }

  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) return existing;

  const pending = requestAuthTokens(refreshToken)
    .then((tokens) => {
      if (tokens) {
        pruneRecentRefreshes();
        recentRefreshes.set(refreshToken, {
          tokens,
          expiresAt: Date.now() + REFRESH_GRACE_MS,
        });
      }
      return tokens;
    })
    .finally(() => {
      inFlightRefreshes.delete(refreshToken);
    });

  inFlightRefreshes.set(refreshToken, pending);
  return pending;
}

async function requestAuthTokens(
  refreshToken: string,
): Promise<AuthTokenPair | null> {
  try {
    const response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    // biome-ignore lint/suspicious/noExplicitAny: response unwrap
    const rawData = (await response.json().catch(() => ({}))) as any;
    const data =
      rawData?.data && typeof rawData.data === "object"
        ? rawData.data
        : rawData;
    const accessToken =
      data?.tokens?.accessToken ?? data?.accessToken ?? rawData?.accessToken;
    const newRefreshToken =
      data?.tokens?.refreshToken ??
      data?.refreshToken ??
      rawData?.refreshToken ??
      refreshToken;

    if (typeof accessToken !== "string" || !accessToken) return null;

    return { accessToken, refreshToken: newRefreshToken };
  } catch {
    return null;
  }
}
