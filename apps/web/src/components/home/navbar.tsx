"use client";

import { ChevronDown, FileText, Layers, LogOut, Menu, Shield, User, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
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
import { logout } from "@/lib/logout";

type CurrentUser = {
  id?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
};

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  async function handleLogout() {
    if (await logout()) {
      window.location.reload();
    }
  }

  const isManagementRole = user?.role === "Admin" || user?.role === "Organizer";
  const userInitial = (user?.fullName || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-ink/90 text-white backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <BrandMark className="rounded-xl" />
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            CINEGEN
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link
            href="/#ongoing-contests"
            className="text-white/70 hover:text-white transition-colors"
          >
            Cuộc thi
          </Link>
          <Link
            href="/archive"
            className="text-white/70 hover:text-white transition-colors"
          >
            Triển lãm số
          </Link>
          <Link
            href="/#ai-features"
            className="text-white/70 hover:text-white transition-colors"
          >
            Tính năng AI
          </Link>
          <Link
            href="/#how-it-works"
            className="text-white/70 hover:text-white transition-colors"
          >
            Thể lệ
          </Link>
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              {isManagementRole && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 rounded-full border-white/20 bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20 hover:text-white transition-all"
                >
                  <Link href="/portal">
                    <Shield className="size-3.5 text-brand-glow" />
                    <span>Portal</span>
                  </Link>
                </Button>
              )}

              {/* Compact User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-2.5 text-xs font-medium text-white transition-all hover:border-white/30 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
                  >
                    <Avatar className="size-6.5 ring-1 ring-white/20">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt="" referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-brand-solid text-white text-[11px] font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[96px] truncate font-medium text-white/90">
                      {user.fullName || user.email}
                    </span>
                    <ChevronDown className="size-3.5 text-white/60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-60 p-1.5">
                  <div className="flex items-center gap-2.5 px-2.5 py-2">
                    <Avatar className="size-8 ring-1 ring-border">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt="" referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {user.fullName || "Người dùng"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "Participant" && (
                    <DropdownMenuItem asChild>
                      <Link href="/my-submissions" className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span>Bài thi của tôi</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "Admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/portal/users" className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        <span>Quản lý tài khoản</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {isManagementRole && (
                    <DropdownMenuItem asChild>
                      <Link href="/portal" className="flex items-center gap-2">
                        <Shield className="size-4 text-brand-solid" />
                        <span>Cổng Quản Trị (Portal)</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild>
                    <Link href="/archive" className="flex items-center gap-2">
                      <Layers className="size-4 text-muted-foreground" />
                      <span>Triển lãm số (Archive)</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="rounded-full px-4 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="rounded-full bg-brand-solid hover:bg-brand-hover text-white px-5 text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Link href="/register">Đăng ký</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white hover:bg-white/10"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-6 pt-3 pb-6 space-y-3">
          {user?.role === "Participant" && (
            <Link
              href="/my-submissions"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Bài thi của tôi
            </Link>
          )}
          <Link
            href="/#ongoing-contests"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Cuộc thi đang diễn ra
          </Link>
          <Link
            href="/archive"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Triển lãm số (Archive)
          </Link>
          <Link
            href="/#ai-features"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Tính năng AI
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Thể lệ tham gia
          </Link>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5 rounded-lg border border-border p-2.5 bg-muted/30">
                  <Avatar className="size-8 ring-1 ring-border">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt="" referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {user.fullName || user.email}
                      </span>
                      <Badge variant="brand" className="h-4 px-1 text-[9px]">
                        {user.role}
                      </Badge>
                    </div>
                    {user.email && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>

                <Button variant="outline" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/profile">Hồ sơ cá nhân</Link>
                </Button>
                {user.role === "Admin" && (
                  <Button variant="outline" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/portal/users">Quản lý tài khoản</Link>
                  </Button>
                )}

                {isManagementRole && (
                  <Button
                    variant="outline"
                    asChild
                    className="w-full justify-center border-brand-glow bg-brand-soft text-brand-solid font-semibold text-xs"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/portal">
                      <Shield className="size-3.5 mr-1.5 text-brand-solid" />
                      <span>Vào Cổng Quản Trị</span>
                    </Link>
                  </Button>
                )}

                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full justify-center text-xs"
                >
                  <LogOut className="size-3.5 mr-1.5" />
                  <span>Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  asChild
                  className="w-full justify-center text-xs"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-center bg-brand-solid text-white hover:bg-brand-hover text-xs font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
