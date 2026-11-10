"use client";

import {
  AlertCircle,
  Film,
  Search,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ContestCard } from "@/components/home/contest-card";
import { filterContests } from "@/lib/contest-utils";
import type { Contest } from "@/types/contest";

export function OngoingContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ongoing" | "published"
  >("ongoing");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gọi API Backend theo hợp đồng chuẩn /api/v1/contests
  useEffect(() => {
    let isMounted = true;
    async function fetchContests() {
      try {
        setLoading(true);
        setError(null);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/v1/contests`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Máy chủ trả về mã lỗi: ${res.status}`);
        }

        const json = await res.json();
        const items = json?.data?.items ?? json?.data ?? [];
        if (isMounted) {
          setContests(Array.isArray(items) ? items : []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errMessage =
            err instanceof Error ? err.message : "Lỗi kết nối tới máy chủ";
          setError(
            `Không thể tải danh sách cuộc thi từ hệ thống (${errMessage}). Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên!`,
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchContests();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lọc cuộc thi theo từ khóa và trạng thái bằng helper thuần
  const filteredContests = useMemo(() => {
    return filterContests(contests, searchQuery, statusFilter);
  }, [contests, searchQuery, statusFilter]);

  return (
    <section id="ongoing-contests" className="py-20 bg-[#111416] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <Film className="h-4 w-4" />
              <span>Sân chơi Nhiếp ảnh Phim</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Cuộc thi đang diễn ra
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
              Danh sách các cuộc thi ảnh phim đang mở nhận bài dự thi hoặc mới
              công bố. Hãy chọn cuộc thi phù hợp và nộp tác phẩm của bạn!
            </p>
          </div>
        </div>

        {/* Thông báo lỗi mạng rõ ràng (Không nuốt lỗi) */}
        {error && (
          <div
            role="alert"
            className="mb-8 flex items-center gap-3 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#191d20] border border-zinc-800 mb-10">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cuộc thi theo tên, thể loại phim (35mm, 120, B&W)..."
              className="w-full rounded-xl bg-zinc-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 border border-zinc-700/60 focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <SlidersHorizontal className="h-4 w-4 text-zinc-500 hidden sm:block ml-2" />
            <button
              type="button"
              onClick={() => setStatusFilter("ongoing")}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === "ongoing"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Đang diễn ra (
              {contests.filter((c) => c.status === "ongoing").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("published")}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === "published"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Sắp công bố (
              {contests.filter((c) => c.status === "published").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === "all"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Tất cả ({contests.length})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Đang tải danh sách cuộc thi từ máy chủ...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredContests.length === 0 && !error && (
          <div className="text-center py-20 px-4 rounded-2xl bg-[#191d20]/50 border border-zinc-800/80">
            <Film className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-200">
              Không tìm thấy cuộc thi nào
            </h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
              Không có cuộc thi nào phù hợp với từ khóa hoặc bộ lọc của bạn. Hãy
              thử tìm kiếm bằng từ khóa khác.
            </p>
            {(searchQuery || statusFilter !== "ongoing") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ongoing");
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Contest Cards Grid */}
        {!loading && filteredContests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Bạn là Đơn vị / Câu lạc bộ muốn tổ chức cuộc thi ảnh phim?
            </h3>
            <p className="text-sm text-zinc-400">
              Tích hợp hệ thống thẩm định AI phát hiện can thiệp số, chấm thi ẩn
              danh kép và triển lãm di sản số hóa.
            </p>
          </div>
          <a
            href="/login"
            className="shrink-0 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-sm font-bold shadow-lg shadow-amber-400/10 transition-colors"
          >
            Đăng ký làm Ban Tổ chức
          </a>
        </div>
      </div>
    </section>
  );
}
