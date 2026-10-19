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
  const token =
    cookieStore.get("refresh_token")?.value ??
    cookieStore.get("access_token")?.value ??
    null;

  const decision = await checkPortalAccess(token);

  if (decision === "login") {
    redirect("/login");
  }

  if (decision === "forbidden") {
    redirect("/forbidden");
  }

  return <>{children}</>;
}
