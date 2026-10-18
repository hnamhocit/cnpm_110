"use client";

import {
  AlertCircle,
  Film,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ContestCard } from "@/components/home/contest-card";
import { filterContests } from "@/lib/contest-utils";
import type { Contest } from "@/types/contest";

// Dữ liệu mẫu phong phú khi Backend chưa chạy hoặc chưa có data
const FALLBACK_CONTESTS: Contest[] = [
  {
    id: "contest-1",
    name: "Khoảnh khắc Phố thị — Sài Gòn & Hà Nội 2026",
    description:
      "Tôn vinh nhịp sống đường phố Việt Nam qua chất ảnh phim hạt mịn. Chấp nhận các định dạng phim 35mm và 120 (Medium Format), màu hoặc trắng đen.",
    start_at: "2026-10-01T00:00:00Z",
    end_at: "2026-11-30T23:59:59Z",
    status: "ongoing",
    category: "Street / 35mm & 120",
    prize: "30.000.000 VNĐ",
  },
  {
    id: "contest-2",
    name: "Black & White Masters — Đơn sắc Đương đại",
    description:
      "Cuộc thi dành riêng cho tín đồ phim đen trắng (Tri-X, Ilford HP5, Kentmere). Tập trung vào nghệ thuật tương phản ánh sáng và bố cục hình khối.",
    start_at: "2026-10-15T00:00:00Z",
    end_at: "2026-12-15T23:59:59Z",
    status: "ongoing",
    category: "B&W Film Only",
    prize: "20.000.000 VNĐ",
  },
  {
    id: "contest-3",
    name: "Sắc màu Điện ảnh — Cinematic Film Shots",
    description:
      "Ghi lại những khung hình mang hơi thở điện ảnh cổ điển với các cuộn phim cine (Vision3 250D/500T, CineStill 800T, Ektachrome).",
    start_at: "2026-10-10T00:00:00Z",
    end_at: "2026-11-20T23:59:59Z",
    status: "ongoing",
    category: "Color Cine Film",
    prize: "25.000.000 VNĐ",
  },
  {
    id: "contest-4",
    name: "Chân dung Con người & Di sản Văn hóa Việt",
    description:
      "Cuộc thi mở nhận bài dự thi về chân dung con người, nghệ nhân và làng nghề truyền thống. Chụp bằng máy ảnh phim cơ quang học.",
    start_at: "2026-10-20T00:00:00Z",
    end_at: "2026-12-31T23:59:59Z",
    status: "ongoing",
    category: "Portrait / Heritage",
    prize: "35.000.000 VNĐ",
  },
  {
    id: "contest-5",
    name: "Mùa Đông Xứ Lạnh — Phong cảnh Phim Khổ Lớn",
    description:
      "Cuộc thi sắp diễn ra dành cho thể loại ảnh phong cảnh thiên nhiên, núi rừng Tây Bắc và vùng cao mùa đông.",
    start_at: "2026-11-01T00:00:00Z",
    end_at: "2026-12-25T23:59:59Z",
    status: "published",
    category: "Landscape / Medium Format",
    prize: "15.000.000 VNĐ",
  },
  {
    id: "contest-6",
    name: "Thử nghiệm Kỹ thuật Tối (Darkroom Experiments)",
    description:
      "Sắp công bố: Dành cho các tác phẩm tráng rọi thủ công tại phòng tối (Darkroom print), kỹ thuật double exposure cơ học trên máy phim.",
    start_at: "2026-11-15T00:00:00Z",
    end_at: "2027-01-15T23:59:59Z",
    status: "published",
    category: "Darkroom / Experimental",
    prize: "18.000.000 VNĐ",
  },
];

export function OngoingContests() {
  const [contests, setContests] = useState<Contest[]>(FALLBACK_CONTESTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ongoing" | "published"
  >("ongoing");
  const [loading, setLoading] = useState(false);
  const [isUsingBackend, setIsUsingBackend] = useState(false);

  // Gọi API Backend nếu có sẵn
  useEffect(() => {
    let isMounted = true;
    async function fetchContests() {
      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
        const res = await fetch(`${apiUrl}/contests`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) {
              setContests(json.data);
              setIsUsingBackend(true);
            }
          }
        }
      } catch {
        // Backend chưa bật hoặc có lỗi mạng -> Giữ nguyên dữ liệu mẫu để giao diện hoạt động tốt
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

          {/* Backend Status indicator */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 self-start md:self-auto">
            <span
              className={`h-2 w-2 rounded-full ${
                isUsingBackend ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>
              {isUsingBackend ? "Kết nối API Backend" : "Chế độ giao diện mẫu"}
            </span>
          </div>
        </div>

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
              Sắp diễn ra (
              {contests.filter((c) => c.status === "published").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === "all"
                  ? "bg-amber-400 text-black font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Tất cả ({contests.length})
            </button>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-zinc-800 bg-[#191d20] p-6 animate-pulse"
              >
                <div className="h-5 w-24 bg-zinc-800 rounded-full mb-4" />
                <div className="h-6 w-3/4 bg-zinc-800 rounded mb-3" />
                <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
                <div className="h-4 w-2/3 bg-zinc-800 rounded mb-6" />
                <div className="h-10 w-full bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredContests.length > 0 ? (
          /* Contests Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#191d20] py-16 px-4 text-center">
            <div className="p-4 rounded-full bg-zinc-900 text-zinc-400 mb-4">
              <AlertCircle className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Không tìm thấy cuộc thi phù hợp
            </h3>
            <p className="mt-1 text-sm text-zinc-400 max-w-sm">
              Không có cuộc thi nào khớp với từ khóa &ldquo;{searchQuery}
              &rdquo;. Hãy thử tìm với từ khóa khác hoặc xóa bộ lọc.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Xóa bộ lọc &amp; xem tất cả</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
