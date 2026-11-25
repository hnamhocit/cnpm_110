"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Layers,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { JudgeProgressDetail } from "@/components/judging/judge-progress-detail";
import { Badge } from "@/components/ui/badge";
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
  filterJudges,
  getContestJudges,
  getJudgeStats,
  getJudgingState,
  JUDGING_STATE_LABELS,
  type JudgingState,
  type JudgingStateFilter,
  summarizeJudgeProgress,
} from "@/lib/judging-progress";
import {
  MOCK_JUDGE_PROGRESS,
  MOCK_JUDGING_CONTESTS,
} from "@/lib/mock-judging-progress";

const STATE_STYLES: Record<JudgingState, string> = {
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  NOT_STARTED: "border-amber-200 bg-amber-50 text-amber-700",
};

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(-2)
    .join("");
}

export default function JudgingProgressPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stateFilter, setStateFilter] = useState<JudgingStateFilter>("ALL");
  const [selectedContest, setSelectedContest] = useState(
    MOCK_JUDGING_CONTESTS[0]?.id ?? "",
  );
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);

  const searchInputId = useId();
  const contestSelectId = useId();
  const categorySelectId = useId();
  const stateSelectId = useId();

  const contestJudges = getContestJudges(
    MOCK_JUDGE_PROGRESS,
    selectedContest,
  );
  const summary = summarizeJudgeProgress(contestJudges);
  const categories = Array.from(
    new Set(contestJudges.flatMap((judge) => judge.categories)),
  ).sort();

  const judges = filterJudges(contestJudges, {
    query: searchTerm,
    category: categoryFilter,
    state: stateFilter,
  });

  const selectedJudge =
    contestJudges.find((judge) => judge.judgeId === selectedJudgeId) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/portal/contests"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách cuộc thi
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Dữ liệu mẫu · chờ API FPC-70–75
          </span>
          <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800">
            <ClipboardCheck className="h-3.5 w-3.5" /> Giám sát tiến độ chấm thi
            (SCR-ORG-08)
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Tiến độ chấm thi của Giám khảo
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi từng giám khảo đã chấm bao nhiêu bài và còn bao nhiêu bài
            chưa chấm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor={contestSelectId}
            className="text-xs whitespace-nowrap text-gray-500"
          >
            Cuộc thi:
          </Label>
          <select
            id={contestSelectId}
            value={selectedContest}
            onChange={(event) => {
              setSelectedContest(event.target.value);
              setSearchTerm("");
              setCategoryFilter("ALL");
              setStateFilter("ALL");
              setSelectedJudgeId(null);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-black focus:outline-none"
          >
            {MOCK_JUDGING_CONTESTS.map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                Bài được phân công
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.assignedCount}
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
              <p className="text-xs font-medium text-gray-500">Đã chấm</p>
              <p className="text-2xl font-bold text-emerald-700">
                {summary.scoredCount}
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
              <p className="text-xs font-medium text-gray-500">Chưa chấm</p>
              <p className="text-2xl font-bold text-amber-700">
                {summary.notScoredCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Tiến độ tổng</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.progressPercent}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-between gap-3 p-4 md:flex-row">
          <div className="relative w-full md:w-96">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id={searchInputId}
              type="text"
              placeholder="Tìm giám khảo theo tên, email, hạng mục..."
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
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label
                htmlFor={stateSelectId}
                className="text-xs whitespace-nowrap text-gray-500"
              >
                Trạng thái:
              </Label>
              <select
                id={stateSelectId}
                value={stateFilter}
                onChange={(event) =>
                  setStateFilter(event.target.value as JudgingStateFilter)
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-black focus:outline-none"
              >
                {(
                  Object.keys(JUDGING_STATE_LABELS) as JudgingStateFilter[]
                ).map((state) => (
                  <option key={state} value={state}>
                    {JUDGING_STATE_LABELS[state]}
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
            Danh sách Giám khảo ({judges.length}/{contestJudges.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Nhấn vào một giám khảo để xem chi tiết từng bài thi đã chấm và chưa
            chấm.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {judges.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<ClipboardCheck className="h-8 w-8" />}
                title="Không có giám khảo phù hợp"
                description="Thử xoá từ khoá tìm kiếm hoặc chọn lại hạng mục, trạng thái."
                action={{
                  label: "Xoá bộ lọc",
                  onClick: () => {
                    setSearchTerm("");
                    setCategoryFilter("ALL");
                    setStateFilter("ALL");
                  },
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Giám khảo</th>
                    <th className="px-4 py-3.5">Hạng mục phụ trách</th>
                    <th className="px-4 py-3.5 text-center">Được giao</th>
                    <th className="px-4 py-3.5 text-center">Đã chấm</th>
                    <th className="px-4 py-3.5 text-center">Chưa chấm</th>
                    <th className="px-4 py-3.5">Tiến độ</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {judges.map((judge) => {
                    const stats = getJudgeStats(judge);
                    const state = getJudgingState(stats);

                    return (
                      <tr
                        key={judge.judgeId}
                        className="transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-700 uppercase">
                              {getInitials(judge.fullName)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {judge.fullName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {judge.role}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex max-w-xs flex-wrap gap-1">
                            {judge.categories.map((category) => (
                              <span
                                key={category}
                                className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center font-bold text-gray-900">
                          {stats.assignedCount}
                        </td>

                        <td className="px-4 py-4 text-center font-semibold text-emerald-600">
                          {stats.scoredCount}
                        </td>

                        <td className="px-4 py-4 text-center font-semibold text-amber-600">
                          {stats.notScoredCount}
                        </td>

                        <td className="min-w-[180px] px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <Badge className={STATE_STYLES[state]}>
                                {JUDGING_STATE_LABELS[state]}
                              </Badge>
                              <span className="font-semibold text-gray-700">
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
                        </td>

                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setSelectedJudgeId(judge.judgeId)}
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" /> Chi tiết
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <JudgeProgressDetail
        key={selectedJudge?.judgeId ?? "none"}
        judge={selectedJudge}
        onClose={() => setSelectedJudgeId(null)}
      />
    </div>
  );
}
