import { create } from "zustand";

export type Role = "Admin" | "Organizer" | "Judge" | "Participant";

type AuthState = {
  accessToken: string | null;
  userRole: Role | null;
  setTokens: (tokens: { accessToken: string; role?: Role }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userRole: null,
  setTokens: ({ accessToken, role }) =>
    set({ accessToken, userRole: role || "Organizer" }),
  clear: () => set({ accessToken: null, userRole: null }),
}));
