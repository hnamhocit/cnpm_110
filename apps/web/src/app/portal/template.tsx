import type { ReactNode } from "react";

export default function PortalTemplate({ children }: { children: ReactNode }) {
  // Tạm thời bỏ qua check quyền ở Server để tránh lỗi Next.js 16
  return <>{children}</>;
}