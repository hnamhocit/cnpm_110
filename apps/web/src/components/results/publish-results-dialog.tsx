"use client";

import { ArrowDown, ArrowUp, Lock, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  getResultsErrorMessage,
  getScoreboard,
  isAbortError,
  publishResults,
} from "@/lib/results-api";
import {
  buildPublishPayload,
  detectTieGroups,
  formatOfficialScore,
  type TieDecision,
  validateTieBreakDecisions,
} from "@/lib/results-validation";
import type { ScoreboardApiEntry } from "@/types/results";

const MSG027 =
  "Công bố kết quả cuộc thi thành công! Toàn bộ bảng điểm đã được khóa bất biến.";

export function PublishResultsDialog({
  open,
  onOpenChange,
  contestId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contestId: string;
  onSuccess?: () => void;
}) {
  const [entries, setEntries] = useState<ScoreboardApiEntry[]>([]);
  const [decisions, setDecisions] = useState<Record<string, TieDecision>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => detectTieGroups(entries), [entries]);
  const validationErrors = useMemo(
    () => validateTieBreakDecisions(groups, decisions),
    [groups, decisions],
  );

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setConfirmed(false);
    setEntries([]);
    setDecisions({});

    getScoreboard(contestId, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        const list = response.data.entries ?? [];
        setEntries(list);
        setDecisions(
          Object.fromEntries(
            detectTieGroups(list).map((group) => [
              group.key,
              { submissionIds: [...group.submissionIds], reason: "" },
            ]),
          ),
        );
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(getResultsErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [contestId, open]);

  function moveSubmission(groupKey: string, index: number, delta: number) {
    setDecisions((previous) => {
      const decision = previous[groupKey];
      if (!decision) return previous;
      const ids = [...decision.submissionIds];
      const target = index + delta;
      if (target < 0 || target >= ids.length) return previous;
      [ids[index], ids[target]] = [ids[target], ids[index]];
      return { ...previous, [groupKey]: { ...decision, submissionIds: ids } };
    });
  }

  async function handleSubmit() {
    if (!confirmed || Object.keys(validationErrors).length > 0) return;
    setSubmitting(true);
    try {
      await publishResults(
        contestId,
        buildPublishPayload(confirmed, decisions),
      );
      toast.success(MSG027);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { status?: number; data?: unknown };
      };
      const payload = apiError?.response?.data;
      const apiMessage =
        typeof payload === "string"
          ? payload
          : payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message?: unknown }).message ?? "")
            : "";
      if (
        apiError?.response?.status === 409 &&
        apiMessage.toLowerCase().includes("proof")
      ) {
        const missingProof = entries.find(
          (entry) => entry.negativeProofVerified === false,
        );
        toast.error(
          getResultsErrorMessage(
            err,
            missingProof?.submissionCode ?? missingProof?.submissionId,
          ),
        );
      } else {
        toast.error(getResultsErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Chốt & công bố kết quả</DialogTitle>
          <DialogDescription>
            Kiểm tra bảng điểm từ API, xác nhận từng nhóm đồng điểm rồi công bố.
            Sau khi công bố, điểm và thứ hạng bị khóa (BR-16).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Đang tải bảng điểm...
          </p>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">Hạng</th>
                    <th className="px-3 py-2">Bài thi</th>
                    <th className="px-3 py-2">Hạng mục</th>
                    <th className="px-3 py-2 text-right">Điểm</th>
                    <th className="px-3 py-2">Bằng chứng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.submissionId}>
                      <td className="px-3 py-2 font-semibold">
                        {entry.rank ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium">{entry.title}</span>
                        <span className="ml-2 font-mono text-xs text-slate-400">
                          {entry.submissionCode ?? entry.submissionId}
                        </span>
                        {entry.discrepancyFlag ? (
                          <Badge variant="ai-warning" className="ml-2">
                            <Lock className="h-3 w-3" />
                            {entry.discrepancyFlag}
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {entry.categoryName}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {formatOfficialScore(entry.finalScore)}
                      </td>
                      <td className="px-3 py-2">
                        {entry.negativeProofVerified ? (
                          <Badge variant="valid">Đã xác minh</Badge>
                        ) : (
                          <Badge variant="ai-warning">Chưa xác minh</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">
                Xác nhận đồng điểm (BR-25)
              </p>
              {groups.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  Không có nhóm đồng điểm cần xác nhận.
                </p>
              ) : (
                groups.map((group) => {
                  const decision = decisions[group.key];
                  const ids = decision?.submissionIds ?? group.submissionIds;
                  return (
                    <div
                      key={group.key}
                      className="space-y-2 rounded-lg border border-slate-200 p-3"
                    >
                      <p className="text-xs font-semibold text-slate-600">
                        {group.categoryId} · {group.score.toFixed(2)} điểm
                      </p>
                      <ul className="space-y-1">
                        {ids.map((submissionId, index) => {
                          const entry = entries.find(
                            (item) => item.submissionId === submissionId,
                          );
                          return (
                            <li
                              key={submissionId}
                              className="flex items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1 text-xs"
                            >
                              <span className="truncate">
                                <span className="mr-2 font-mono text-slate-500">
                                  {index + 1}
                                </span>
                                {entry?.title ?? submissionId}
                              </span>
                              <span className="flex shrink-0 gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label="Đẩy lên"
                                  disabled={index === 0}
                                  onClick={() =>
                                    moveSubmission(group.key, index, -1)
                                  }
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label="Đẩy xuống"
                                  disabled={index === ids.length - 1}
                                  onClick={() =>
                                    moveSubmission(group.key, index, 1)
                                  }
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="space-y-1">
                        <Label htmlFor={`reason-${group.key}`}>
                          Lý do xác nhận thứ hạng (tối đa 1000 ký tự)
                        </Label>
                        <textarea
                          id={`reason-${group.key}`}
                          maxLength={1000}
                          rows={2}
                          value={decision?.reason ?? ""}
                          onChange={(event) =>
                            setDecisions((previous) => ({
                              ...previous,
                              [group.key]: {
                                submissionIds: ids,
                                reason: event.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                        />
                        {validationErrors[group.key] ? (
                          <p className="flex items-center gap-1 text-xs text-red-600">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {validationErrors[group.key]}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                Tôi xác nhận đã chốt điểm, thứ hạng và giải thưởng. Hiểu rằng
                toàn bộ bảng điểm sẽ bị khóa bất biến sau khi công bố (BR-16).
              </span>
            </label>
          </>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              loading ||
              submitting ||
              !confirmed ||
              Boolean(error) ||
              Object.keys(validationErrors).length > 0
            }
          >
            {submitting ? "Đang công bố..." : "Chốt & công bố"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
