import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { type TokenPair, tokenStorage } from "@/lib/http/token-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const TIMEOUT_MS = 15_000;

const LOGIN_PATH = "/auth/login";
const REGISTER_PATH = "/auth/register";
const REFRESH_PATH = "/auth/refresh";
const LOGIN_PAGE = "/login";

const AUTH_PATHS = [LOGIN_PATH, REGISTER_PATH, REFRESH_PATH];

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const http = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

function isAuthRequest(url?: string): boolean {
  return AUTH_PATHS.some((path) => url?.includes(path));
}

function parseTokens(payload: unknown, currentRefreshToken: string): TokenPair {
  const body = payload as { data?: unknown } | null;
  const source = (body?.data ?? body ?? {}) as Partial<TokenPair>;

  if (!source.accessToken) {
    throw new Error("Refresh response thiếu accessToken");
  }

  return {
    accessToken: source.accessToken,
    refreshToken: source.refreshToken ?? currentRefreshToken,
  };
}

async function requestNewTokens(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error("Không có refresh token");

  const { data } = await axios.post(
    `${API_URL}${REFRESH_PATH}`,
    { refreshToken },
    { timeout: TIMEOUT_MS },
  );

  const tokens = parseTokens(data, refreshToken);
  tokenStorage.setTokens(tokens);
  return tokens.accessToken;
}

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestNewTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

let onAuthFailure = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== LOGIN_PAGE) {
    window.location.assign(LOGIN_PAGE);
  }
};

export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

http.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
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

    try {
      const accessToken = await refreshAccessToken();
      original.headers.set("Authorization", `Bearer ${accessToken}`);
      return http(original);
    } catch (refreshError) {
      tokenStorage.clear();
      onAuthFailure();
      return Promise.reject(refreshError);
    }
  },
);
