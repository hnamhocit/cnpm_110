"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Header from "../components/portal/Header";
import { Camera, LayoutDashboard, Trophy, Users, BarChart3 } from "lucide-react";

// Các mục điều hướng của Portal
const menuItems = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Contests", href: "/portal/contests", icon: Trophy },
  { label: "Judges", href: "/portal/contests/judges", icon: Users },
  { label: "Reports", href: "/portal/reports", icon: BarChart3 },
];

// Kiểu dữ liệu cho Sidebar
type SidebarProps = {
  onClose?: () => void;
};

// Component Sidebar phong cách SaaS hiện đại đồng bộ theme
function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto bg-slate-900 px-4 py-6 text-white border-r border-slate-800">
      {/* LOGO */}
      <div className="mb-8 flex items-center justify-between gap-2 px-2">
        <Link
          href="/portal"
          onClick={onClose}
          className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <Camera className="h-5 w-5" />
          </div>
          <span className="text-base font-bold">Film Contest</span>
        </Link>

        {/* Nút đóng Sidebar trên Mobile */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* NAVIGATION LINKS */}
      <nav aria-label="Portal Navigation" className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/portal"
              ? pathname === "/portal"
              : item.href === "/portal/contests"
                ? pathname === "/portal/contests" ||
                  (pathname.startsWith("/portal/contests/") &&
                    !pathname.startsWith("/portal/contests/judges"))
                : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 font-semibold text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER INFO */}
      <div className="mt-auto border-t border-slate-800/80 pt-4 px-2">
        <p className="text-xs text-slate-400 font-mono">Workspace v1.0 • CNPM</p>
      </div>
    </aside>
  );
}

// Kiểu dữ liệu cho Shell
type PortalShellProps = {
  children: ReactNode;
};

export default function PortalShell({ children }: PortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* SIDEBAR PC */}
      <div className="hidden lg:block lg:w-60 lg:shrink-0">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      {/* SIDEBAR MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          />

          <div className="relative z-10 w-64 max-w-[80vw] shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* HEADER */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* NỘI DUNG CHÍNH CỦA TRANG */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
