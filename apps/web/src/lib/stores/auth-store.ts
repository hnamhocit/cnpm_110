import { create } from "zustand";

import type { Role } from "@/lib/route-access";

export type TokenPair = {
  accessToken: string;
  role?: Role;
};

type AuthState = {
  accessToken: string | null;
  userRole: Role | null;
  setTokens: (tokens: TokenPair) => void;
  clear: () => void;
};

// refreshToken nằm trong cookie HttpOnly do BFF quản lý, memory chỉ giữ accessToken.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userRole: null,
  setTokens: ({ accessToken, role }) =>
    set((state) => ({
      accessToken,
      userRole: role ?? state.userRole,
    })),
  clear: () => set({ accessToken: null, userRole: null }),
}));
