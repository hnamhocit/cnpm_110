import { create } from "zustand";

import type { Role } from "@/lib/route-access";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
};

type UserState = {
  user: User | null;
  loadedAt: number;
  setUser: (user: User) => void;
  clearUser: () => void;
};

let revision = 0;
let pending: Promise<User | null> | null = null;
const MAX_AGE_MS = 5 * 60_000;

// Memory only: reloads validate HttpOnly cookies again; navigation reuses the user.
export const useUserStore = create<UserState>((set) => ({
  user: null,
  loadedAt: 0,
  setUser: (user) => {
    revision += 1;
    pending = null;
    set({ user, loadedAt: Date.now() });
  },
  clearUser: () => {
    revision += 1;
    pending = null;
    set({ user: null, loadedAt: 0 });
  },
}));

export function loadCurrentUser(): Promise<User | null> {
  const state = useUserStore.getState();
  if (state.loadedAt && Date.now() - state.loadedAt < MAX_AGE_MS) {
    return Promise.resolve(state.user);
  }
  if (pending) return pending;
  const requestRevision = revision;
  const request = (async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok && response.status !== 401) {
      throw new Error("Không thể tải thông tin tài khoản.");
    }
    const user = response.ok
      ? ((await response.json()).user as User | null)
      : null;
    if (revision !== requestRevision) return useUserStore.getState().user;
    useUserStore.setState({ user, loadedAt: Date.now() });
    return user;
  })().finally(() => {
    if (pending === request) pending = null;
  });
  pending = request;
  return request;
}
