"use client";

import { Camera, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#111416]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-md group-hover:scale-105 transition-transform">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              FILM CONTEST
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                <Sparkles className="h-2.5 w-2.5" /> AI Powered
              </span>
            </span>
            <p className="text-[11px] text-zinc-400 font-mono">
              Film Photography Platform
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="#ongoing-contests"
            className="text-zinc-300 hover:text-amber-400 transition-colors"
          >
            Cuộc thi đang diễn ra
          </Link>
          <Link
            href="#ai-features"
            className="text-zinc-300 hover:text-amber-400 transition-colors"
          >
            Tính năng AI
          </Link>
          <Link
            href="#how-it-works"
            className="text-zinc-300 hover:text-amber-400 transition-colors"
          >
            Thể lệ tham gia
          </Link>
          <Link
            href="/judge/login"
            className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-mono border border-zinc-700 rounded px-2.5 py-1"
          >
            Dành cho Giám khảo
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-zinc-200 hover:text-white transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            Đăng ký
          </Link>
          <Link
            href="/portal"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-black hover:bg-amber-300 transition-colors shadow-sm"
          >
            Cổng Quản trị
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white focus:outline-none"
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
        <div className="md:hidden border-b border-zinc-800 bg-[#191d20] px-4 pt-2 pb-6 space-y-3">
          <Link
            href="#ongoing-contests"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Cuộc thi đang diễn ra
          </Link>
          <Link
            href="#ai-features"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Tính năng AI
          </Link>
          <Link
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Thể lệ tham gia
          </Link>
          <Link
            href="/judge/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-amber-400 hover:bg-zinc-800"
          >
            Đăng nhập Giám khảo
          </Link>
          <div className="pt-3 border-t border-zinc-700/50 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center rounded-md border border-zinc-700 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center rounded-md border border-zinc-700 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Đăng ký
            </Link>
            <Link
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center rounded-md bg-amber-400 py-2 text-sm font-medium text-black hover:bg-amber-300"
            >
              Vào Cổng Quản trị
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
