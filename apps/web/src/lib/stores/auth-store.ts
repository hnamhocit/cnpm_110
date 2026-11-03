import { create } from "zustand";

import type { Role } from "@/lib/route-access";

const ALLOWED_ROLES = ["Admin", "Organizer", "Judge", "Participant"] as const;

export type TokenPair = {
  accessToken: string;
  role?: (typeof ALLOWED_ROLES)[number];
};

type AuthState = {
  accessToken: string | null;
  userRole: (typeof ALLOWED_ROLES)[number] | null;
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
