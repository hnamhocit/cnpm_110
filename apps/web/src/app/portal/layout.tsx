
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
            className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl hover:bg-white/10 md:hidden"
          >
            ×
          </button>
        )}
      </div>

      {/* NAVIGATION */}
      <nav aria-label="Portal navigation" className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--portal-primary)] text-[#292821]"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-xs opacity-70">
                {item.number}
              </span>

              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto border-t border-white/10 pt-5">
        <p className="text-xs text-gray-400">
          Film Photography Contest
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Portal Workspace
        </p>
      </div>
    </aside>
  );
}

// Kiểu dữ liệu cho Layout
type PortalLayoutProps = {
  children: ReactNode;
};

export default function PortalLayout({
  children,
}: PortalLayoutProps) {
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
