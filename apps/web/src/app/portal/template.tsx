import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { checkPortalAccess } from "@/lib/portal-auth";

type PortalTemplateProps = {
  children: ReactNode;
};

async function AuthGuard({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value ?? null;

  const decision = await checkPortalAccess(accessToken);

  if (decision === "login") {
    redirect("/login");
  }

  if (decision === "forbidden") {
    redirect("/forbidden");
  }

  return <>{children}</>;
}

export default function PortalTemplate({ children }: PortalTemplateProps) {
  return (
    <Suspense
      fallback={<div className="p-8 text-sm text-gray-400">Loading portal...</div>}
    >
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
