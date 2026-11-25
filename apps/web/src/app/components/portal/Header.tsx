"use client";

import { ChevronDown, Globe, LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/logout";

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
      if (await logout()) {
        window.location.replace("/login");
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  // Nhận diện vai trò từ token / profile người dùng
  const role = user?.role || "Organizer";
  const isOrganizer = role === "Organizer";
  const roleTitle = isOrganizer
    ? "Ban tổ chức (Organizer)"
    : "Quản trị viên (Admin)";
  const roleSubtitle = isOrganizer
    ? "Ban tổ chức Cuộc thi"
    : "Quản trị viên Hệ thống";
  const initials = isOrganizer ? "BTC" : "AD";
  const displayName =
    user?.fullName || (isOrganizer ? "Ban Tổ Chức" : "Quản Trị Viên");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
      {/* LEFT SIDE */}
      <div className="flex min-w-0 items-center gap-3">
        {/* MOBILE MENU BUTTON */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Mở menu điều hướng"
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-5" />
        </Button>

        {/* PAGE TITLE */}
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground font-medium">
            CINEGEN / {pageName}
          </p>

          <h2 className="truncate text-sm font-bold text-foreground sm:text-base">
            Portal Workspace
          </h2>
        </div>
      </div>

      {/* RIGHT SIDE - ACTIONS & PROFILE */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hidden sm:inline-flex rounded-full text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Link href="/">
            <Globe className="size-3.5" />
            <span>Về trang chủ</span>
          </Link>
        </Button>

        {/* PROFILE MENU DROPDOWN */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex cursor-pointer items-center gap-2.5 rounded-full border border-border/80 bg-background/80 py-1 pl-2 pr-2.5 shadow-2xs transition-all hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="hidden text-xs font-medium text-foreground/90 sm:block">
                {roleTitle}
              </span>

              <Avatar className="size-8 ring-1 ring-border">
                <AvatarFallback className="bg-brand-solid text-white text-xs font-bold shadow-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-1.5">
            <div className="border-b border-border px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-semibold text-foreground">
                  {displayName}
                </p>
                <Badge variant="brand" className="h-4 px-1 text-[9px]">
                  {role}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-brand-solid">
                {roleSubtitle}
              </p>
              {user?.email && (
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>

            <div className="py-1">
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <span>Về trang chủ CINEGEN</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span>Hồ sơ cá nhân</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="size-4" />
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
