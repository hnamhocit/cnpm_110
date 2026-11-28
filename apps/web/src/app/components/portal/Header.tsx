"use client";

import { ChevronDown, Globe, LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { logout } from "@/lib/logout";

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useCurrentUser();

  const pageName =
    pathname === "/portal/contests"
      ? "Contests"
      : pathname === "/portal/reports"
        ? "Reports"
        : pathname.startsWith("/portal/master-data")
          ? "Master Data"
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

  const roleLabels = {
    Admin: "Quản trị viên",
    Administrator: "Quản trị viên",
    "Contest Organizer": "Ban tổ chức",
    Organizer: "Ban tổ chức",
    Judge: "Giám khảo",
    Participant: "Thí sinh",
  };
  const roleTitle = user?.role ? roleLabels[user.role] : "Đang tải tài khoản…";
  const displayName = user?.fullName?.trim() || user?.email || "Tài khoản";
  const nameParts = user?.fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = nameParts.length
    ? nameParts
        .slice(-2)
        .map((part) => Array.from(part)[0])
        .join("")
        .toLocaleUpperCase("vi")
    : "?";

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
              aria-label={`Mở menu tài khoản: ${displayName}, ${roleTitle}`}
              className="group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border border-border/80 bg-background px-2.5 py-2 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Avatar className="size-8 ring-1 ring-border">
                <AvatarImage
                  src={user?.avatarUrl ?? undefined}
                  alt=""
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-brand-solid text-white text-xs font-bold shadow-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <span className="hidden min-w-0 sm:block">
                <span
                  className="block max-w-40 truncate text-sm font-semibold text-foreground"
                  title={displayName}
                >
                  {displayName}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {roleTitle}
                </span>
              </span>

              <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 max-w-[calc(100vw-2rem)] p-1.5"
          >
            <div className="space-y-2 border-b border-border px-3 py-3">
              <p className="break-words text-sm font-semibold leading-5 text-foreground">
                {displayName}
              </p>
              {user?.email && (
                <p className="break-all text-xs leading-5 text-muted-foreground">
                  {user.email}
                </p>
              )}
              {user?.role && <Badge variant="brand">{roleTitle}</Badge>}
            </div>

            <div className="py-1">
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <span>Về trang chủ CINEGEN</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="size-4" />
                  Hồ sơ cá nhân
                </Link>
              </DropdownMenuItem>
              {user?.role === "Admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/portal/users">Quản lý tài khoản</Link>
                </DropdownMenuItem>
              )}
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
