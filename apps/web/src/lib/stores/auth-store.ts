import { create } from "zustand";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: TokenPair) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  setTokens: ({ accessToken, refreshToken }) =>
    set({ accessToken, refreshToken }),
  clear: () => set({ accessToken: null, refreshToken: null }),
}));
