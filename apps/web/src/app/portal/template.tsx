import type { ReactNode } from "react";

export default function PortalTemplate({ children }: { children: ReactNode }) {
  // Tạm thời bỏ qua check quyền ở Server để test giao diện Dashboard
  // (Vì Access Token đang được lưu ở Zustand phía Client)
  return <>{children}</>;
}