"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { JudgeScoresDialog } from "@/components/scoreboard/judge-scores-dialog";
import { ScoreboardStatusBadge } from "@/components/scoreboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchMockScoreboard,
  MOCK_SCOREBOARD_CONTESTS,
} from "@/lib/mock-scoreboard";
import {
  filterScoreboard,
  formatScore,
  rankScoreboard,
  SCOREBOARD_STATUS_LABELS,
  type ScoreboardFilters,
  summarizeScoreboard,
} from "@/lib/scoreboard";
import type {
  RankedScoreboardEntry,
  ScoreboardEntry,
  ScoreboardStatus,
} from "@/types/scoreboard";

const POLL_INTERVAL_MS = 10_000;

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-100 text-amber-800",
  2: "bg-slate-200 text-slate-700",
  3: "bg-orange-100 text-orange-800",
};

function formatUpdatedAt(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ScoreboardPage() {
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState<ScoreboardFilters["status"]>("ALL");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [selectedContest, setSelectedContest] = useState(
    MOCK_SCOREBOARD_CONTESTS[0]?.id ?? "",
  );

  const searchInputId = useId();
  const categorySelectId = useId();
  const statusSelectId = useId();
  const contestSelectId = useId();

  const loadScoreboard = useCallback(async () => {
    try {
      const snapshot = await fetchMockScoreboard();
      setEntries(snapshot.entries);
      setUpdatedAt(snapshot.updatedAt);
      setError(null);
    } catch {
      setError(
        "Không thể tải bảng điểm. Hệ thống sẽ thử lại ở lần cập nhật sau.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScoreboard();
  }, [loadScoreboard]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      void loadScoreboard();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLive, loadScoreboard]);

  const summary = summarizeScoreboard(entries);
  const rankedEntries = rankScoreboard(entries);
  const categories = Array.from(
    new Map(
      entries.map((entry) => [
        entry.categoryId,
        { id: entry.categoryId, name: entry.categoryName },
      ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name, "vi"));

  const filteredEntries = filterScoreboard(rankedEntries, {
    query: searchTerm,
    categoryId: categoryFilter,
    status: statusFilter,
  });

  const selectedEntry: RankedScoreboardEntry | null =
    rankedEntries.find(
      (entry) => entry.submissionId === selectedSubmissionId,
    ) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/portal/contests"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách cuộc thi
        </Link>
        <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
          Bảng điểm tổng hợp (SCR-ORG-09)
        </span>
      </div>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bảng điểm tổng hợp
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Điểm chung cuộc của từng bài thi, cập nhật trực tiếp khi giám khảo
            nộp phiếu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLive ? "animate-ping bg-emerald-400" : "bg-gray-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isLive ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
            </span>
            <span className={isLive ? "text-emerald-700" : "text-gray-500"}>
              {isLive ? "Trực tiếp" : "Tạm dừng"}
            </span>
            <span className="text-gray-400">
              · {formatUpdatedAt(updatedAt)}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setIsLive((value) => !value)}
          >
            {isLive ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Tạm dừng
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Tiếp tục
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => void loadScoreboard()}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <Label
          htmlFor={contestSelectId}
          className="text-xs whitespace-nowrap text-gray-500"
        >
          Cuộc thi:
        </Label>
        <select
          id={contestSelectId}
          value={selectedContest}
          onChange={(event) => setSelectedContest(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:ring-1 focus:ring-black focus:outline-none"
        >
          {MOCK_SCOREBOARD_CONTESTS.map((contest) => (
            <option key={contest.id} value={contest.id}>
              {contest.name}
            </option>
          ))}
        </select>
        <span className="text-gray-400">
          · Tự động làm mới mỗi {POLL_INTERVAL_MS / 1000} giây
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Tổng bài thi</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.total}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Đã đủ phiếu</p>
              <p className="text-2xl font-bold text-emerald-700">
                {summary.completed}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Đang chấm</p>
              <p className="text-2xl font-bold text-amber-700">
                {summary.judging}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                Lệch điểm &gt; 30%
              </p>
              <p className="text-2xl font-bold text-rose-700">
                {summary.discrepancy}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {summary.missingProof > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {summary.missingProof} bài thi chưa xác minh ảnh âm bản — không đủ
            điều kiện trao giải (BR-06).
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => void loadScoreboard()}
          >
            Thử lại
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col items-center justify-between gap-3 p-4 md:flex-row">
          <div className="relative w-full md:w-96">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id={searchInputId}
              type="text"
              placeholder="Tìm theo mã bài, tên tác phẩm..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 pl-9 text-sm"
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <div className="flex items-center gap-2">
              <Label
                htmlFor={categorySelectId}
                className="text-xs whitespace-nowrap text-gray-500"
              >
                Hạng mục:
              </Label>
              <select
                id={categorySelectId}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-black focus:outline-none"
              >
                <option value="ALL">Tất cả hạng mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label
                htmlFor={statusSelectId}
                className="text-xs whitespace-nowrap text-gray-500"
              >
                Trạng thái:
              </Label>
              <select
                id={statusSelectId}
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as ScoreboardFilters["status"],
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-black focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {(
                  Object.keys(SCOREBOARD_STATUS_LABELS) as ScoreboardStatus[]
                ).map((status) => (
                  <option key={status} value={status}>
                    {SCOREBOARD_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg">
            Bảng điểm ({filteredEntries.length}/{rankedEntries.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Xếp hạng theo từng hạng mục; bài chưa đủ phiếu điểm chưa được xếp
            hạng.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-8 text-center text-sm text-gray-500">
              Đang tải bảng điểm...
            </p>
          ) : filteredEntries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Layers className="h-8 w-8" />}
                title="Không có bài thi phù hợp"
                description="Thử xoá từ khoá tìm kiếm hoặc chọn lại hạng mục, trạng thái."
                action={{
                  label: "Xoá bộ lọc",
                  onClick: () => {
                    setSearchTerm("");
                    setCategoryFilter("ALL");
                    setStatusFilter("ALL");
                  },
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3.5 text-center">Hạng</th>
                    <th className="px-4 py-3.5">Bài thi</th>
                    <th className="px-4 py-3.5">Hạng mục</th>
                    <th className="px-4 py-3.5 text-center">Giám khảo</th>
                    <th className="px-4 py-3.5 text-right">Điểm chung cuộc</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.submissionId}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-4 text-center">
                        {entry.rank === null ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              RANK_STYLES[entry.rank] ??
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {entry.rank}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-semibold text-gray-900">
                              {entry.title}
                              {!entry.negativeProofVerified && (
                                <ShieldAlert
                                  className="h-3.5 w-3.5 shrink-0 text-amber-500"
                                  aria-label="Chưa xác minh ảnh âm bản"
                                />
                              )}
                            </p>
                            <p className="font-mono text-xs text-gray-400">
                              {entry.submissionCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                          {entry.categoryName}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center text-xs text-gray-600">
                        {entry.scores.length}/{entry.judgeCount}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-gray-900">
                          {formatScore(entry.finalScore)}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">
                          / {formatScore(entry.scoreScale)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <ScoreboardStatusBadge status={entry.status} />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setSelectedSubmissionId(entry.submissionId)
                          }
                        >
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <JudgeScoresDialog
        key={selectedEntry?.submissionId ?? "none"}
        entry={selectedEntry}
        onClose={() => setSelectedSubmissionId(null)}
      />
    </div>
  );
}
