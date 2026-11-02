import { create } from "zustand";

import type { Role } from "@/lib/route-access";

const ALLOWED_ROLES = ["Admin", "Organizer", "Judge", "Participant"] as const;

export type TokenPair = {
  accessToken: string;
  refreshToken?: string;
  role?: (typeof ALLOWED_ROLES)[number];
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userRole: (typeof ALLOWED_ROLES)[number] | null;
  setTokens: (tokens: TokenPair) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userRole: null,
  setTokens: ({ accessToken, refreshToken, role }) => {
    if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      throw new Error("Invalid role");
    }
    set((state) => ({
      accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
      userRole: role,
    }));
  },
  clear: () => set({ accessToken: null, refreshToken: null, userRole: null }),
}));
