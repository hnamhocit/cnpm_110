"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { User, LogOut, ShieldCheck, Mail, Calendar, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";

type UserProfile = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  createdAt?: string;
};

type HeaderProps = {
  onMenuClick: () => void;
};

function getInitials(name?: string, role?: string): string {
  if (!name || !name.trim()) {
    return (role || "US").slice(0, 2).toUpperCase();
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setProfile(data.user);
          }
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
      }
    }
    fetchMe();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    // Clear client cookies & store
    // biome-ignore lint/suspicious/noDocumentCookie: Client-side cookie purge
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    useAuthStore.getState().clear();
    window.location.href = "/login";
  };

  const displayName = profile?.fullName || "Ban Tổ Chức";
  const displayRole = profile?.role || "Organizer";
  const initials = getInitials(displayName, displayRole);

  const pageName =
    pathname === "/portal/contests"
      ? "Contests"
      : pathname === "/portal/reports"
        ? "Reports"
        : pathname.startsWith("/portal/contests/")
          ? "Contest Detail"
          : "Dashboard";

  return (
    <>
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
              {displayName}
            </span>

            {/* AVATAR */}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--portal-primary)] text-sm font-bold text-[#292821]">
              {initials}
            </span>

            <span className="hidden text-xs text-gray-300 sm:block">▼</span>
          </summary>

          {/* PROFILE DROPDOWN */}
          <div className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#303437] p-3 text-white shadow-2xl">
            <div className="border-b border-white/10 pb-3">
              <p className="font-semibold text-white truncate">{displayName}</p>
              <p className="mt-0.5 text-xs text-amber-300 font-medium">
                {displayRole} Account
              </p>
              {profile?.email && (
                <p className="mt-1 text-xs text-gray-400 truncate">{profile.email}</p>
              )}
            </div>

            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-white/10 cursor-pointer"
              >
                <User className="h-4 w-4 text-gray-400" />
                <span>Thông tin tài khoản</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-400" />
                <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </button>
            </div>
          </div>
        </details>
      </header>

      {/* PROFILE DIALOG */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md border border-white/15 bg-[#25282a] text-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--portal-primary)] text-lg font-bold text-[#292821]">
                {initials}
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {displayName}
                </DialogTitle>
                <p className="text-xs text-amber-300 font-medium">{displayRole} Workspace</p>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-3 divide-y divide-white/10 text-sm">
            <div className="pt-2 flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" /> Email:
              </span>
              <span className="font-medium text-gray-100">{profile?.email || "Chưa cập nhật"}</span>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-400" /> Quyền hạn:
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                {displayRole}
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Trạng thái:
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Đang hoạt động
              </span>
            </div>

            {profile?.createdAt && (
              <div className="pt-3 flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" /> Ngày tạo:
                </span>
                <span className="font-medium text-gray-300">
                  {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProfileOpen(false)}
              className="border-white/20 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 text-white hover:bg-red-700 font-medium cursor-pointer"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              {isLoggingOut ? "Đang thoát..." : "Đăng xuất"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
