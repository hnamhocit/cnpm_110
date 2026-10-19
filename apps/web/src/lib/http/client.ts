import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const TIMEOUT_MS = 15_000;

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const http = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${API_URL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true },
        );
        const newAccessToken = res.data.data.accessToken;
        useAuthStore.getState().setTokens({ accessToken: newAccessToken });
        original.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return http(original);
      } catch (refreshErr) {
        useAuthStore.getState().clear();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  },
);
