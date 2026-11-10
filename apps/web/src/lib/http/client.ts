import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { tokenStorage } from "@/lib/http/token-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const TIMEOUT_MS = 15_000;

const AUTH_PATHS = ["/auth/login", "/auth/register"];

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const http = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

function isAuthRequest(url?: string): boolean {
  return AUTH_PATHS.some((path) => url?.includes(path));
}

let sessionPromise: Promise<string | null> | null = null;

// Refresh token nằm trong cookie HttpOnly; BFF đổi nó lấy access token mới.
function refreshSession(): Promise<string | null> {
  if (!sessionPromise) {
    sessionPromise = fetch("/api/auth/session", {
      method: "POST",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;

        const data = (await response.json()) as { accessToken?: string };
        if (!data.accessToken) return null;

        tokenStorage.setTokens({ accessToken: data.accessToken });
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        sessionPromise = null;
      });
  }

  return sessionPromise;
}

http.interceptors.request.use(async (config) => {
  let accessToken = tokenStorage.getAccessToken();

  // Sau khi F5, memory mất token nhưng cookie HttpOnly vẫn còn.
  if (!accessToken && !isAuthRequest(config.url)) {
    accessToken = await refreshSession();
  }

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;

    const shouldRefresh =
      error.response?.status === 401 &&
      original !== undefined &&
      !original._retry &&
      !isAuthRequest(original.url);

    if (!shouldRefresh || !original) {
      return Promise.reject(error);
    }

    original._retry = true;

    const accessToken = await refreshSession();
    if (!accessToken) {
      tokenStorage.clear();
      return Promise.reject(error);
    }

    original.headers.set("Authorization", `Bearer ${accessToken}`);
    return http(original);
  },
);
