import { Calendar, ChevronRight, Clock, Film } from "lucide-react";
import Link from "next/link";
import { formatContestDate } from "@/lib/contest-utils";
import type { Contest } from "@/types/contest";

interface ContestCardProps {
  contest: Contest;
}

export function ContestCard({ contest }: ContestCardProps) {
  const isOngoing = contest.status === "ongoing";

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10">
      <div>
        {/* Status Badge & Category */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {isOngoing ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Đang diễn ra
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
              <Clock className="h-3 w-3" />
              Sắp diễn ra
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            <Film className="h-3 w-3 text-blue-600" />
            {contest.category ?? "Film 35mm / 120"}
          </span>
        </div>

        {/* Contest Name */}
        <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {contest.name}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
          {contest.description ||
            "Chưa có mô tả chi tiết cho cuộc thi này. Nhấn xem chi tiết để tìm hiểu thể lệ và yêu cầu nộp ảnh."}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100">
        {/* Timeline */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Thời hạn:</span>
          <span className="font-semibold text-slate-700">
            {formatContestDate(contest.start_at)} —{" "}
            {formatContestDate(contest.end_at)}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/contests/${contest.id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 border border-blue-200/80 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            <span>Xem chi tiết &amp; Nộp ảnh</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
