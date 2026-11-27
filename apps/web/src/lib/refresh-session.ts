import { createHash } from "node:crypto";

import { API_INTERNAL_URL } from "./server-api";

type Tokens = { accessToken: string; refreshToken: string };
const pending = new Map<string, Promise<Tokens | null>>();

// Both BFF auth routes share one rotation for concurrent requests in this process.
export function refreshSession(refreshToken: string): Promise<Tokens | null> {
  const key = createHash("sha256").update(refreshToken).digest("hex");
  const existing = pending.get(key);
  if (existing) return existing;

  const request = (async () => {
    const response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`Session refresh failed (${response.status})`);
    const raw = await response.json();
    const data = raw.data ?? raw;
    if (typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") {
      throw new Error("Session refresh returned invalid tokens");
    }
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  })().finally(() => pending.delete(key));

  pending.set(key, request);
  return request;
}
