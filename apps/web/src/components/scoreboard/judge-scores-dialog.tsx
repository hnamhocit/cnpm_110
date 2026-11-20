"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

import { ScoreboardStatusBadge } from "@/components/scoreboard/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatScore } from "@/lib/scoreboard";
import type { RankedScoreboardEntry } from "@/types/scoreboard";

type JudgeScoresDialogProps = {
  entry: RankedScoreboardEntry | null;
  onClose: () => void;
};

function formatSubmittedAt(isoDate: string): string {
  return new Date(isoDate).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JudgeScoresDialog({ entry, onClose }: JudgeScoresDialogProps) {
  const remainingJudges = entry
    ? Math.max(entry.judgeCount - entry.scores.length, 0)
    : 0;

  return (
    <Dialog
      open={entry !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8">{entry.title}</DialogTitle>
              <DialogDescription>
                <span className="font-mono">{entry.submissionCode}</span>
                {" · "}
                {entry.categoryName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div>
                <p className="text-xs text-gray-500">Điểm chung cuộc (BR-25)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatScore(entry.finalScore)}
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    / {formatScore(entry.scoreScale)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <ScoreboardStatusBadge status={entry.status} />
                <p className="mt-1 text-xs text-gray-500">
                  {entry.scores.length}/{entry.judgeCount} giám khảo đã nộp
                </p>
              </div>
            </div>

            {entry.status === "DISCREPANCY" && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Chênh lệch điểm vượt 30% thang điểm — cần Ban tổ chức điều
                  phối trước khi công bố kết quả (BR-14).
                </span>
              </div>
            )}

            {!entry.negativeProofVerified && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Chưa xác minh ảnh âm bản đối chứng — không đủ điều kiện trao
                  giải (BR-06).
                </span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Điểm từng giám khảo
              </p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {entry.scores.map((score) => (
                  <li
                    key={score.judgeId}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {score.judgeName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Nộp lúc {formatSubmittedAt(score.submittedAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatScore(score.totalScore)}
                    </span>
                  </li>
                ))}
              </ul>

              {remainingJudges > 0 && (
                <p className="text-xs text-gray-500">
                  Còn {remainingJudges} giám khảo chưa nộp phiếu điểm.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
