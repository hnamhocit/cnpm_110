"use client";

import { usePathname } from "next/navigation";

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const pageName =
    pathname === "/portal/contests"
      ? "Contests"
      : pathname === "/portal/reports"
        ? "Reports"
        : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[var(--portal-header)] px-4 py-3 sm:px-6 lg:px-8">
      {/* LEFT SIDE */}
      <div className="flex min-w-0 items-center gap-3">
        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Mở menu điều hướng"
          className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-lg text-white hover:bg-white/10 md:hidden"
        >
          <span className="h-0.5 w-5 bg-current" />
          <span className="h-0.5 w-5 bg-current" />
          <span className="h-0.5 w-5 bg-current" />
        </button>

        {/* PAGE TITLE */}
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-400">
            Film Contest / {pageName}
          </p>

          <h2 className="truncate text-sm font-semibold text-white sm:text-base">
            Portal Workspace
          </h2>
        </div>
      </div>

      {/* RIGHT SIDE - PROFILE MENU */}
      <details className="relative shrink-0">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--portal-primary)] [&::-webkit-details-marker]:hidden">
          <span className="hidden text-sm font-medium text-gray-200 sm:block">
            Demo Judge
          </span>

          {/* AVATAR */}
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--portal-primary)] text-sm font-bold text-[#292821]">
            JD
          </span>

          <span className="hidden text-xs text-gray-300 sm:block">▼</span>
        </summary>

        {/* PROFILE DROPDOWN */}
        <div className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#303437] p-3 text-white shadow-2xl">
          <div className="border-b border-white/10 pb-3">
            <p className="font-semibold">Demo Judge</p>

            <p className="mt-1 text-xs text-gray-400">Judge Account</p>
          </div>

          <div className="mt-3 space-y-1">
            <p className="rounded-lg px-3 py-3 text-sm text-gray-300">
              My Profile (Coming soon)
            </p>

            <p className="rounded-lg px-3 py-3 text-sm text-amber-300">
              Logout (Coming soon)
            </p>
          </div>
        </div>
      </details>
    </header>
  );
}
