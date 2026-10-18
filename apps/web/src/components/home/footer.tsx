import { Camera, Film, Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-[#0d0f11] py-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-black">
                <Camera className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                FILM CONTEST PLATFORM
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-4">
              Nền tảng tổ chức và quản lý cuộc thi nhiếp ảnh phim tích hợp trí
              tuệ nhân tạo. Gìn giữ nghệ thuật quang học và tôn vinh khoảnh khắc
              nguyên bản.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <Film className="h-3.5 w-3.5 text-amber-400" />
              <span>Capstone Project 2026 — CNPM 110</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-4">
              Điều hướng
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#ongoing-contests"
                  className="hover:text-amber-400 transition-colors"
                >
                  Cuộc thi đang diễn ra
                </a>
              </li>
              <li>
                <a
                  href="#ai-features"
                  className="hover:text-amber-400 transition-colors"
                >
                  Tính năng AI
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-amber-400 transition-colors"
                >
                  Thể lệ nộp bài
                </a>
              </li>
              <li>
                <Link
                  href="/judge/login"
                  className="hover:text-amber-400 transition-colors"
                >
                  Cổng Giám khảo
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Portal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-4">
              Hệ thống
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="hover:text-amber-400 transition-colors"
                >
                  Đăng nhập tài khoản
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-amber-400 transition-colors"
                >
                  Đăng ký thí sinh
                </Link>
              </li>
              <li>
                <Link
                  href="/portal"
                  className="hover:text-amber-400 transition-colors"
                >
                  Cổng Quản trị (Portal)
                </Link>
              </li>
              <li>
                <Link
                  href="/forbidden"
                  className="hover:text-amber-400 transition-colors"
                >
                  Trang phân quyền (403)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Film Photography Contest Platform.
            All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Xây dựng với</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500 inline" />
            <span>Next.js 16, TypeScript &amp; Hono</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
