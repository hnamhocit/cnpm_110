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

  const filteredContests = useMemo(() => {
    return filterContests(contests, searchQuery, statusFilter);
  }, [contests, searchQuery, statusFilter]);

  return (
    <section id="ongoing-contests" className="py-20 bg-white text-slate-900 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
              <Film className="h-4 w-4" />
              <span>Sân chơi Nhiếp ảnh Phim</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Cuộc thi đang diễn ra
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              Danh sách các cuộc thi ảnh phim đang mở nhận bài dự thi hoặc mới
              công bố. Hãy chọn cuộc thi phù hợp và nộp tác phẩm của bạn!
            </p>
          </div>
        </div>

        {/* Thông báo lỗi mạng */}
        {error && (
          <div
            role="alert"
            className="mb-8 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-10 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cuộc thi theo tên, thể loại phim (35mm, 120, B&W)..."
              className="w-full rounded-xl bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
            <button
              type="button"
              onClick={() => setStatusFilter("ongoing")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === "ongoing"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-300"
              }`}
            >
              Đang diễn ra (
              {contests.filter((c) => c.status === "ongoing").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("published")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === "published"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-300"
              }`}
            >
              Sắp công bố (
              {contests.filter((c) => c.status === "published").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-300"
              }`}
            >
              Tất cả ({contests.length})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Đang tải danh sách cuộc thi từ máy chủ...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredContests.length === 0 && !error && (
          <div className="text-center py-20 px-4 rounded-2xl bg-slate-50 border border-slate-200">
            <Film className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">
              Không tìm thấy cuộc thi nào
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
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
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
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
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
              <Trophy className="h-5 w-5 text-blue-600" />
              Bạn là Đơn vị / Câu lạc bộ muốn tổ chức cuộc thi ảnh phim?
            </h3>
            <p className="text-sm text-slate-600">
              Tích hợp hệ thống thẩm định AI phát hiện can thiệp số, chấm thi ẩn
              danh kép và triển lãm di sản số hóa.
            </p>
          </div>
          <a
            href="/login"
            className="shrink-0 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/30 transition-all"
          >
            Đăng ký làm Ban Tổ chức
          </a>
        </div>
      </div>
    </section>
  );
}
