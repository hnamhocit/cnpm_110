"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  archiveContest,
  buildArchiveContestInput,
  getExhibitionErrorMessage,
  isAbortError,
} from "@/lib/exhibition-api";
import { getContestResults } from "@/lib/results-api";
import { isOfficialResults } from "@/lib/results-validation";
import type { OfficialResultEntry } from "@/types/results";

const MSG028 =
  "Đã xuất bản tác phẩm vào Kho lưu trữ số và Phòng triển lãm trực tuyến.";
const NOT_OFFICIAL_MESSAGE =
  "Kết quả chưa được công bố/không phải snapshot chính thức";

type ArchiveSubmissionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contestId: string;
  existingSubmissionIds: string[];
  onSuccess?: () => void;
};

function hasAwardOrRank(entry: OfficialResultEntry): boolean {
  return Boolean(
    entry.award ||
      entry.awardTitle ||
      entry.awardRank !== null ||
      (typeof entry.rank === "number" && entry.rank > 0),
  );
}

function mergeOfficialEntries(
  entries: OfficialResultEntry[],
  winners: OfficialResultEntry[],
  excludedIds: Set<string>,
): OfficialResultEntry[] {
  const byId = new Map<string, OfficialResultEntry>();

  for (const entry of [...entries, ...winners]) {
    if (!entry?.submissionId || excludedIds.has(entry.submissionId)) continue;
    const current = byId.get(entry.submissionId);
    const shouldReplace =
      !current ||
      (!hasAwardOrRank(current) && hasAwardOrRank(entry)) ||
      (!current.isProofVerified && entry.isProofVerified);
    if (shouldReplace) byId.set(entry.submissionId, entry);
  }

  return [...byId.values()].sort((a, b) => {
    const rankA = a.rank || Number.MAX_SAFE_INTEGER;
    const rankB = b.rank || Number.MAX_SAFE_INTEGER;
    return rankA - rankB || a.title.localeCompare(b.title);
  });
}

function getHttpStatus(error: unknown): number | undefined {
  const apiError = error as { response?: { status?: number } } | null;
  return apiError?.response?.status;
}

export function ArchiveSubmissionsDialog({
  open,
  onOpenChange,
  contestId,
  existingSubmissionIds,
  onSuccess,
}: ArchiveSubmissionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [entries, setEntries] = useState<OfficialResultEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [includeFinalists, setIncludeFinalists] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const existingKey = existingSubmissionIds.join("\u0000");

  useEffect(() => {
    if (!open) return;

    const excludedIds = new Set(existingKey ? existingKey.split("\u0000") : []);
    const controller = new AbortController();
    setLoading(true);
    setSubmitting(false);
    setBlocked(false);
    setError(null);
    setEntries([]);
    setSelected([]);
    setIncludeFinalists(true);

    getContestResults(contestId)
      .then((results) => {
        if (controller.signal.aborted) return;
        if (!isOfficialResults(results)) {
          setBlocked(true);
          setError(NOT_OFFICIAL_MESSAGE);
          return;
        }

        const candidates = mergeOfficialEntries(
          results.entries,
          results.winners,
          excludedIds,
        );
        setEntries(candidates);
        setSelected(
          candidates
            .filter((entry) => entry.isProofVerified && hasAwardOrRank(entry))
            .map((entry) => entry.submissionId),
        );
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        const status = getHttpStatus(err);
        if (status === 400 || status === 404 || status === 409) {
          setBlocked(true);
          setError(NOT_OFFICIAL_MESSAGE);
          return;
        }
        setError(getExhibitionErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [contestId, existingKey, open]);

  function toggleSubmission(submissionId: string) {
    setSelected((previous) =>
      previous.includes(submissionId)
        ? previous.filter((id) => id !== submissionId)
        : [...previous, submissionId],
    );
  }

  async function handleSubmit() {
    if (selected.length === 0 && !includeFinalists) {
      setError(
        "Vui lòng chọn ít nhất 1 tác phẩm hoặc bật “Gồm tất cả thí sinh chung kết”.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await archiveContest(
        contestId,
        buildArchiveContestInput({
          submissionIds: selected.length ? selected : undefined,
          includeFinalists,
          publish: true,
        }),
      );
      toast.success(MSG028);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      const submissionCode =
        getHttpStatus(err) === 409
          ? entries.find((entry) => !entry.isProofVerified)?.submissionCode
          : undefined;
      const message = getExhibitionErrorMessage(err, submissionCode);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Đưa tác phẩm vào triển lãm</DialogTitle>
          <DialogDescription>
            Chọn tác phẩm từ snapshot kết quả chính thức. Tác phẩm chưa xác minh
            bằng chứng không được chọn theo BR-06.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Đang tải kết quả chính thức...
          </p>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {!loading && !blocked ? (
          <>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <Checkbox
                aria-label="Gồm tất cả thí sinh chung kết (includeFinalists)"
                checked={includeFinalists}
                disabled={submitting}
                onCheckedChange={(checked) =>
                  setIncludeFinalists(checked === true)
                }
              />
              <span>Gồm tất cả thí sinh chung kết (includeFinalists)</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">Tác phẩm</th>
                    <th className="px-3 py-2">Hạng mục</th>
                    <th className="px-3 py-2">Giải</th>
                    <th className="px-3 py-2">Bằng chứng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-sm text-slate-500"
                      >
                        Không có tác phẩm mới từ kết quả chính thức.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const disabled = !entry.isProofVerified || submitting;
                      return (
                        <tr
                          key={entry.submissionId}
                          className={disabled ? "opacity-60" : ""}
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`archive-submission-${entry.submissionId}`}
                                checked={selected.includes(entry.submissionId)}
                                disabled={disabled}
                                onCheckedChange={() =>
                                  toggleSubmission(entry.submissionId)
                                }
                              />
                              <label
                                htmlFor={`archive-submission-${entry.submissionId}`}
                                className="cursor-pointer font-medium text-slate-900"
                              >
                                {entry.title}
                              </label>
                            </div>
                            <p className="ml-6 mt-0.5 font-mono text-xs text-slate-400">
                              {entry.submissionCode || entry.submissionId} ·{" "}
                              {entry.authorName}
                            </p>
                            {!entry.isProofVerified ? (
                              <p className="ml-6 mt-0.5 text-xs text-red-600">
                                Không thể chọn: bằng chứng chưa được xác minh
                                (BR-06).
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {entry.categoryName}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {entry.awardTitle ||
                              entry.award ||
                              (entry.rank > 0 ? `Hạng ${entry.rank}` : "—")}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={
                                entry.isProofVerified ? "valid" : "ai-warning"
                              }
                            >
                              {entry.isProofVerified
                                ? "Đã xác minh"
                                : "Chưa xác minh"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
            disabled={loading || submitting || blocked}
          >
            {submitting ? "Đang đưa vào triển lãm..." : "Đưa vào triển lãm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
