import { create } from "zustand";

import type { Role } from "@/lib/route-access";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
};

type UserState = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
