import { toast } from "sonner";

import { useAuthStore } from "@/lib/stores/auth-store";

export async function logout(): Promise<boolean> {
  const response = await fetch("/api/auth/logout", { method: "POST" }).catch(
    () => null,
  );

  if (!response?.ok) {
    toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    return false;
  }

  useAuthStore.getState().clear();
  return true;
}
