"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function ForbiddenPage() {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    // Purge cookies & store
    // biome-ignore lint/suspicious/noDocumentCookie: cookie purge
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    useAuthStore.getState().clear();
    window.location.href = "/login";
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#111416] text-white">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-[#1c1f23] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-4 border border-red-500/20">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-5xl font-extrabold text-red-500 tracking-tight">403</h1>

        <h2 className="mt-3 text-2xl font-bold text-white">Không có quyền truy cập (Access Denied)</h2>

        <p className="mt-3 text-sm text-gray-300 leading-relaxed">
          Tài khoản của bạn hiện mang vai trò <span className="font-semibold text-amber-300">Thí sinh (Participant)</span>. 
          Theo quy định phân quyền hệ thống (RBAC), <span className="font-semibold text-white">Cổng Quản trị (Portal)</span> chỉ dành riêng cho vai trò <span className="font-semibold text-emerald-400">Ban tổ chức (Organizer)</span> và <span className="font-semibold text-blue-400">Quản trị viên (Admin)</span> để quản lý cuộc thi và chấm thi.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Đổi tài khoản Ban tổ chức
          </button>
        </div>
      </div>
    </main>
  );
}
