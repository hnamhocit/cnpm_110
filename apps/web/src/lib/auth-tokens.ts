import { API_INTERNAL_URL } from "./server-api";

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

type JwtPayload = {
  role?: string;
  exp?: number;
};

type RefreshCache = {
  inFlight: Map<string, Promise<AuthTokenPair | null>>;
  recent: Map<string, { tokens: AuthTokenPair; expiresAt: number }>;
};

const CACHE_KEY = "__filmContestRefreshCache__";
const REFRESH_GRACE_MS = 5_000;

// Next.js có thể bundle mỗi route handler thành một module riêng, nên đặt cache
// trên globalThis để các route /api/auth/* dùng chung trong cùng process.
function getCache(): RefreshCache {
  const globalStore = globalThis as typeof globalThis & {
    [CACHE_KEY]?: RefreshCache;
  };

  if (!globalStore[CACHE_KEY]) {
    globalStore[CACHE_KEY] = {
      inFlight: new Map(),
      recent: new Map(),
    };
  }

  return globalStore[CACHE_KEY];
}

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
// cùng refresh bằng một token, request đến sau sẽ dùng token đã bị thu hồi và
// làm người dùng bị đăng xuất oan. Gộp các lần refresh đang chạy và giữ kết quả
// trong một khoảng grace ngắn để request tới trễ vẫn nhận cùng cặp token.
export function refreshAuthTokens(
  refreshToken: string,
): Promise<AuthTokenPair | null> {
  const cache = getCache();
  const cached = cache.recent.get(refreshToken);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.tokens);
  }

  const existing = cache.inFlight.get(refreshToken);
  if (existing) return existing;

  const pending = requestAuthTokens(refreshToken)
    .then((tokens) => {
      if (tokens) {
        pruneRecent(cache);
        cache.recent.set(refreshToken, {
          tokens,
          expiresAt: Date.now() + REFRESH_GRACE_MS,
        });
      }
      return tokens;
    })
    .finally(() => {
      cache.inFlight.delete(refreshToken);
    });

  cache.inFlight.set(refreshToken, pending);
  return pending;
}

export function clearRefreshCache(): void {
  const cache = getCache();
  cache.recent.clear();
}

function pruneRecent(cache: RefreshCache): void {
  const now = Date.now();
  for (const [token, entry] of cache.recent) {
    if (entry.expiresAt <= now) cache.recent.delete(token);
  }
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
    const accessToken = data?.accessToken ?? rawData?.accessToken;
    const newRefreshToken =
      data?.refreshToken ?? rawData?.refreshToken ?? refreshToken;

    if (!accessToken) return null;

    return { accessToken, refreshToken: newRefreshToken };
  } catch {
    return null;
  }
}
