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
  { label: "Reports", href: "/portal/reports", number: "03" },
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

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh bg-[var(--portal-background)] text-[var(--portal-text)]">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar />
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay: bấm bên ngoài để đóng */}
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/70"
          />

          {/* Sidebar trượt từ phía trái */}
          <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* MAIN SECTION */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* PAGE CONTENT */}
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
