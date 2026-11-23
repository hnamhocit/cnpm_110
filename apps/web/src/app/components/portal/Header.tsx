"use client";

import { LogOut, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

type HeaderProps = {
  onMenuClick: () => void;
};

type CurrentUser = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clear);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setUser(data.user);
          }
        }
      } catch {
        // Not authenticated
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const pageName =
    pathname === "/portal/contests"
      ? "Contests"
      : pathname === "/portal/reports"
        ? "Reports"
        : pathname.startsWith("/portal/contests/judges")
          ? "Judges Management"
          : pathname.startsWith("/portal/contests/")
            ? "Contest Detail"
            : "Dashboard";

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      clearAuth();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  // Nhận diện vai trò từ token / profile người dùng
  const role = user?.role || "Organizer";
  const isOrganizer = role === "Organizer";
  const roleTitle = isOrganizer ? "Ban tổ chức (Organizer)" : "Quản trị viên (Admin)";
  const roleSubtitle = isOrganizer
    ? "Ban tổ chức Cuộc thi"
    : "Quản trị viên Hệ thống";
  const initials = isOrganizer ? "BTC" : "AD";
  const displayName = user?.fullName || (isOrganizer ? "Ban Tổ Chức" : "Quản Trị Viên");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      {/* LEFT SIDE */}
      <div className="flex min-w-0 items-center gap-3">
        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Mở menu điều hướng"
          className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <span className="h-0.5 w-5 bg-current" />
          <span className="h-0.5 w-5 bg-current" />
          <span className="h-0.5 w-5 bg-current" />
        </button>

        {/* PAGE TITLE */}
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500 font-medium">
            Film Contest / {pageName}
          </p>

          <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
            Portal Workspace
          </h2>
        </div>
      </div>

      {/* RIGHT SIDE - PROFILE MENU */}
      <details className="relative shrink-0">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500 [&::-webkit-details-marker]:hidden">
          <span className="hidden text-sm font-medium text-slate-700 sm:block">
            {roleTitle}
          </span>

          {/* AVATAR */}
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm shadow-blue-600/30">
            {initials}
          </span>

          <span className="hidden text-xs text-slate-400 sm:block">▼</span>
        </summary>

        {/* PROFILE DROPDOWN */}
        <div className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
          <div className="border-b border-slate-100 pb-3">
            <p className="font-semibold text-slate-900">{displayName}</p>
            <p className="mt-0.5 text-xs text-blue-600 font-medium">
              {roleSubtitle}
            </p>
            {user?.email && (
              <p className="mt-0.5 text-xs text-slate-400 truncate">
                {user.email}
              </p>
            )}
          </div>

          <div className="mt-2 space-y-1">
            <button
              type="button"
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
            >
              <User className="h-4 w-4 text-slate-400" />
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </button>
          </div>
        </div>
      </details>
    </header>
  );
}
