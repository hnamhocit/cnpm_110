import { create } from "zustand";

export type Role = "Admin" | "Organizer" | "Judge" | "Participant";

type AuthState = {
  accessToken: string | null;
  userRole: Role | null; // Thêm biến lưu Role
  setTokens: (tokens: { accessToken: string; refreshToken?: string; role?: Role }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userRole: null,
  setTokens: ({ accessToken, role }) => 
    set({ accessToken, userRole: role || "Organizer" }), // Mặc định là Organizer nếu không có
  clear: () => set({ accessToken: null, userRole: null }),
}));