"use client";

import { LogOut, Menu, Shield, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { BrandMark } from "@/components/brand-mark";

type CurrentUser = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const clearAuth = useAuthStore((state) => state.clear);

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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    clearAuth();
    // biome-ignore lint/suspicious/noDocumentCookie: Clear cookie
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
    window.location.reload();
  }

  const isManagementRole = user?.role === "Admin" || user?.role === "Organizer";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="rounded-xl" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            CINEGEN
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/#ongoing-contests"
            className="text-slate-600 hover:text-brand-solid transition-colors"
          >
            Cuộc thi đang diễn ra
          </Link>
          <Link
            href="/archive"
            className="text-slate-600 hover:text-brand-solid transition-colors"
          >
            Triển lãm số (Archive)
          </Link>
          <Link
            href="/#ai-features"
            className="text-slate-600 hover:text-brand-solid transition-colors"
          >
            Tính năng AI
          </Link>
          <Link
            href="/#how-it-works"
            className="text-slate-600 hover:text-brand-solid transition-colors"
          >
            Thể lệ tham gia
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {isManagementRole && (
                <Link
                  href="/portal"
                  className="flex items-center gap-1.5 rounded-xl bg-brand-soft border border-brand-glow px-3.5 py-1.5 text-xs font-semibold text-brand-hover hover:bg-brand-soft transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-brand-solid" />
                  <span>Vào Cổng Quản Trị</span>
                </Link>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium bg-slate-100 px-3 py-1.5 rounded-lg">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[120px] truncate">{user.fullName || user.email}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-solid text-white font-bold">{user.role}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-solid transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-solid px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-solid/25 hover:bg-brand-hover active:scale-95 transition-all"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-6 pt-3 pb-6 space-y-3">
          <Link
            href="/#ongoing-contests"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Cuộc thi đang diễn ra
          </Link>
          <Link
            href="/archive"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Triển lãm số (Archive)
          </Link>
          <Link
            href="/#ai-features"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Tính năng AI
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Thể lệ tham gia
          </Link>
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{user.fullName || user.email} ({user.role})</span>
                </div>
                {isManagementRole && (
                  <Link
                    href="/portal"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl bg-brand-soft border border-brand-glow py-2.5 text-sm font-semibold text-brand-hover"
                  >
                    Vào Cổng Quản Trị (Portal)
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-brand-solid py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-solid/25 hover:bg-brand-hover"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
