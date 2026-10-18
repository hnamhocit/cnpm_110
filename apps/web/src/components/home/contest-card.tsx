import { Calendar, ChevronRight, Clock, Film, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatContestDate } from "@/lib/contest-utils";
import type { Contest } from "@/types/contest";

interface ContestCardProps {
  contest: Contest;
}

export function ContestCard({ contest }: ContestCardProps) {
  const isOngoing = contest.status === "ongoing";

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-[#191d20] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5">
      <div>
        {/* Status Badge & Category */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {isOngoing ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Đang diễn ra
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
              <Clock className="h-3 w-3" />
              Sắp diễn ra
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
            <Film className="h-3 w-3 text-amber-400" />
            {contest.category ?? "Film 35mm / 120"}
          </span>
        </div>

        {/* Contest Name */}
        <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors line-clamp-1">
          {contest.name}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm text-zinc-400 line-clamp-3 leading-relaxed">
          {contest.description ||
            "Chưa có mô tả chi tiết cho cuộc thi này. Nhấn xem chi tiết để tìm hiểu thể lệ và yêu cầu nộp ảnh."}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-zinc-800/80">
        {/* Timeline */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
          <span>Thời hạn:</span>
          <span className="font-medium text-zinc-200">
            {formatContestDate(contest.start_at)} —{" "}
            {formatContestDate(contest.end_at)}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/contests/${contest.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-amber-400 hover:text-black transition-colors"
          >
            <span>Xem chi tiết &amp; Nộp ảnh</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/portal"
            className="p-2.5 rounded-xl border border-zinc-700/80 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            title="Quản lý cuộc thi (Portal)"
          >
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
