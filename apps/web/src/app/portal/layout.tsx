import { Suspense } from "react";
import type { ReactNode } from "react";
import PortalShell from "./portal-shell";

type PortalLayoutProps = {
  children: ReactNode;
};

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--portal-bg)]" />}>
      <PortalShell>{children}</PortalShell>
    </Suspense>
  );
}
