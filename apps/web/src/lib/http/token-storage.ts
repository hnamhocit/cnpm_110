import { type TokenPair, useAuthStore } from "@/lib/stores/auth-store";

export type { TokenPair };

export const tokenStorage = {
  getAccessToken(): string | null {
    return useAuthStore.getState().accessToken;
  },

  getRefreshToken(): string | null {
    return useAuthStore.getState().refreshToken;
  },

  setTokens(tokens: TokenPair): void {
    useAuthStore.getState().setTokens(tokens);
  },

  clear(): void {
    useAuthStore.getState().clear();
  },
};
