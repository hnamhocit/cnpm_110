import { create } from "zustand";

import type { Role } from "@/lib/route-access";

export type TokenPair = {
  accessToken: string;
  refreshToken?: string;
  role?: Role;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userRole: Role | null;
  setTokens: (tokens: TokenPair) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userRole: null,
  setTokens: ({ accessToken, refreshToken, role }) =>
    set((state) => ({
      accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
      userRole: role ?? state.userRole,
    })),
  clear: () => set({ accessToken: null, refreshToken: null, userRole: null }),
}));
