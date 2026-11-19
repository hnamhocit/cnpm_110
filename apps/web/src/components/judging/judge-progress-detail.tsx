"use client";

import { CheckCircle2, Clock, Search } from "lucide-react";
import { useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { filterJudgeSubmissions, getJudgeStats } from "@/lib/judging-progress";
import type { JudgeProgress, JudgingStatus } from "@/types/judging";

type JudgeProgressDetailProps = {
  judge: JudgeProgress | null;
  onClose: () => void;
};

const STATUS_FILTERS: { value: "ALL" | JudgingStatus; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "SCORED", label: "Đã chấm" },
  { value: "NOT_SCORED", label: "Chưa chấm" },
];

function formatScoredAt(isoDate: string): string {
  return new Date(isoDate).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JudgeProgressDetail({
  judge,
  onClose,
}: JudgeProgressDetailProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | JudgingStatus>(
    "ALL",
  );
  const [searchTerm, setSearchTerm] = useState("");

  const searchInputId = useId();

  const stats = judge ? getJudgeStats(judge) : null;
  const submissions = judge
    ? filterJudgeSubmissions(judge.submissions, {
        query: searchTerm,
        status: statusFilter,
      })
    : [];

  return (
    <Dialog
      open={judge !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {judge && stats && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8">{judge.fullName}</DialogTitle>
              <DialogDescription>
                {judge.role} · {judge.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                <span>
                  Đã chấm{" "}
                  <strong className="text-emerald-700">
                    {stats.scoredCount}
                  </strong>
                  /{stats.assignedCount} bài
                </span>
                <span>
                  Còn lại{" "}
                  <strong className="text-amber-700">
                    {stats.notScoredCount}
                  </strong>{" "}
                  bài
                </span>
                <span className="font-semibold text-gray-900">
                  {stats.progressPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    stats.progressPercent === 100
                      ? "bg-emerald-500"
                      : stats.progressPercent >= 70
                        ? "bg-blue-500"
                        : "bg-amber-500"
                  }`}
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id={searchInputId}
                  type="text"
                  placeholder="Tìm theo mã bài, tiêu đề..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>

              <fieldset
                aria-label="Lọc theo trạng thái chấm"
                className="m-0 flex min-w-0 items-center gap-1 rounded-lg border border-gray-200 bg-white p-1"
              >
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={statusFilter === filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      statusFilter === filter.value
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </fieldset>
            </div>

            {submissions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                Không có bài thi nào khớp bộ lọc.
              </p>
            ) : (
              <ul className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                {submissions.map((submission) => (
                  <li
                    key={submission.submissionId}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {submission.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        <span className="font-mono">
                          {submission.submissionCode}
                        </span>
                        {" · "}
                        {submission.categoryName}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {submission.status === "SCORED" ? (
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Đã chấm
                        </Badge>
                      ) : (
                        <Badge className="border border-amber-200 bg-amber-50 text-amber-700">
                          <Clock className="h-3 w-3" /> Chưa chấm
                        </Badge>
                      )}
                      {submission.scoredAt && (
                        <span className="text-xs whitespace-nowrap text-gray-400">
                          {formatScoredAt(submission.scoredAt)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
