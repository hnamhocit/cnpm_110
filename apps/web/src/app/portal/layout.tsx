import type { ReactNode } from "react";
import PortalShell from "./portal-shell";

type PortalLayoutProps = {
  children: ReactNode;
};

export default function PortalLayout({ children }: PortalLayoutProps) {
  return <PortalShell>{children}</PortalShell>;
}
