
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { checkPortalAccess } from "@/lib/portal-auth";

type PortalTemplateProps = {
  children: ReactNode;
};

export default async function PortalTemplate({
  children,
}: PortalTemplateProps) {
  // Lấy JWT từ cookie trên Server
  const cookieStore = await cookies();

  // TODO(FPC-16): Thống nhất tên cookie với hệ thống Auth.
  const accessToken =
    cookieStore.get("access_token")?.value ?? null;

  // Gọi Backend xác minh JWT và quyền truy cập
  const decision = await checkPortalAccess(accessToken);

  if (decision === "login") {
    redirect("/login");
  }

  if (decision === "forbidden") {
    redirect("/forbidden");
  }

  return <>{children}</>;
}
