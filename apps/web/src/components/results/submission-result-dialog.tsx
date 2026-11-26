"use client";

import { Award, Lock, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getResultsErrorMessage,
  getSubmissionFeedback,
  isAbortError,
} from "@/lib/results-api";
import { formatOfficialScore } from "@/lib/results-validation";
import type { SubmissionFeedbackResponse } from "@/types/results";

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function formatPrize(value: number | null): string {
  return value === null ? "—" : `${value.toLocaleString("vi-VN")} ₫`;
}

export function SubmissionResultDialog({
  open,
  onOpenChange,
  submissionId,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  title: string;
}) {
  const [data, setData] = useState<SubmissionFeedbackResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);

    getSubmissionFeedback(submissionId, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setData(response.data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 409) {
          setError("Kết quả cuộc thi chưa được công bố.");
          return;
        }
        setError(getResultsErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, submissionId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Kết quả: {title}</DialogTitle>
          <DialogDescription>
            Điểm, hạng và nhận xét từ snapshot kết quả chính thức.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Đang tải kết quả...
          </p>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {data && !error ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm">
                <p className="font-semibold text-slate-900">
                  {data.contestName}
                </p>
                <p className="text-xs text-slate-500">
                  {data.categoryName} · Công bố lúc{" "}
                  {formatPublishedAt(data.publishedAt)}
                </p>
              </div>
              {data.resultsLocked ? (
                <Badge variant="valid">
                  <Lock className="h-3 w-3" /> Đã khóa
                </Badge>
              ) : null}
            </div>

            {data.result ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Hạng</p>
                  <p className="text-lg font-bold text-slate-900">
                    {data.result.rank}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Điểm chung cuộc</p>
                  <p className="text-lg font-bold text-slate-900">
                    {data.result.finalScoreFormatted ||
                      formatOfficialScore(data.result.finalScore)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Giải</p>
                  <p className="flex items-center gap-1 font-semibold text-slate-900">
                    <Award className="h-4 w-4 text-amber-600" />
                    {data.result.awardTitle ?? data.result.award ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Giá trị giải</p>
                  <p className="font-semibold text-slate-900">
                    {formatPrize(data.result.prizeValueVnd)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Không có kết quả chính thức cho bài này.
              </p>
            )}

            <div className="space-y-2">
              <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                <MessageSquareText className="h-4 w-4 text-blue-600" />
                Nhận xét từ giám khảo
              </p>
              {data.feedback.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  Chưa có nhận xét cho bài này.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.feedback.map((item) => (
                    <li
                      key={item.evaluationId}
                      className="space-y-2 rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">
                          {item.judgeName}
                        </p>
                        <Badge variant="outline">
                          {formatOfficialScore(item.totalScore)} điểm
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {item.comment?.trim() || "Không có nhận xét."}
                      </p>
                      <ul className="flex flex-wrap gap-1.5">
                        {item.criterionScores.map((criterion) => (
                          <li
                            key={criterion.criterionId}
                            className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-600"
                          >
                            {criterion.criterionName ?? criterion.criterionId}:{" "}
                            {formatOfficialScore(criterion.score)}
                            {criterion.maxScore !== undefined
                              ? ` / ${formatOfficialScore(criterion.maxScore)}`
                              : ""}
                            {criterion.weight !== undefined
                              ? ` (x${criterion.weight})`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
