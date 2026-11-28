"use client";

import { useEffect } from "react";
import { loadCurrentUser, useUserStore } from "@/lib/stores/user-store";

export function useCurrentUser() {
  const user = useUserStore((state) => state.user);
  useEffect(() => {
    const load = () => {
      void loadCurrentUser().catch(() => {});
    };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);
  return user;
}
