"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Header from "../components/portal/Header";

// Các mục điều hướng của Portal
const menuItems = [
  { label: "Dashboard", href: "/portal", number: "01" },
  { label: "Contests", href: "/portal/contests", number: "02" },
  { label: "Judges", href: "/portal/contests/judges", number: "03" },
  { label: "Reports", href: "/portal/reports", number: "04" },
];

// Kiểu dữ liệu cho Sidebar
type SidebarProps = {
  onClose?: () => void;
};

// Component Sidebar dùng chung cho PC và Mobile
function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto bg-[var(--portal-sidebar)] px-5 py-6 text-white">
      {/* LOGO */}
      <div className="mb-10 flex items-center justify-between gap-2">
        <Link
          href="/portal"
          onClick={onClose}
          className="text-xl font-bold tracking-tight text-[var(--portal-primary)]"
        >
          Film Contest
        </Link>

        {/* Nút đóng Sidebar trên Mobile */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* NAVIGATION LINKS */}
      <nav aria-label="Portal Navigation" className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
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
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--portal-primary)] font-semibold text-[#292821] shadow-sm"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`text-xs ${
                  isActive ? "text-[#292821]/70" : "text-gray-500"
                }`}
              >
                {item.number}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER INFO */}
      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="text-xs text-gray-400">Portal v0.1.0</p>
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

  // Nhấn Escape để đóng Sidebar
  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[var(--portal-bg)]">
      {/* SIDEBAR PC */}
      <div className="hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-[var(--portal-border)]">
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
          {/* Backdrop tối */}
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          />

          {/* Sidebar Drawer */}
          <div className="relative z-10 w-72 max-w-[80vw] shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* HEADER */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* NỘI DUNG CHÍNH CỦA TRANG */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
