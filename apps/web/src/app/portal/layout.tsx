import { Suspense, type ReactNode } from "react";
import PortalShell from "./portal-shell";

type PortalLayoutProps = {
  children: ReactNode;
};

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1a1d1f] text-gray-400">
          Loading portal...
        </div>
      }
    >
      <PortalShell>{children}</PortalShell>
    </Suspense>
  );
}
