<<<<<<< Updated upstream

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

=======
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { checkPortalAccess } from "@/lib/portal-auth";
export const dynamic = "force-dynamic";

type PortalTemplateProps = {
  children: ReactNode;
};

export default async function PortalTemplate({
  children,
}: PortalTemplateProps) {
  const cookieStore = await cookies();
  // Lấy token từ HttpOnly Cookie
  const token =
    cookieStore.get("refresh_token")?.value ??
    cookieStore.get("access_token")?.value ??
    null;

  // Gọi Backend kiểm tra quyền
  const decision = await checkPortalAccess(token);

  if (decision === "login") {
    redirect("/login");
  }

  if (decision === "forbidden") {
    redirect("/forbidden");
  }

>>>>>>> Stashed changes
  return <>{children}</>;
}
