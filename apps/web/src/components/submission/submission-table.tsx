"use client";

import {
  AlertTriangle,
  Check,
  Eye,
  FileClock,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import ImageComparisonModal from "@/components/submission/image-comparison-modal";
import { LiveCountdown48h } from "@/components/submission/live-countdown-48h";
import { ProofReviewModal } from "@/components/submission/proof-review-modal";
import { RequestProofModal } from "@/components/submission/request-proof-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAiErrorMessage,
  triggerBatchAiScan,
  triggerSingleAiScan,
} from "@/lib/ai-api";
import { formatContestDate } from "@/lib/contest-utils";
import { http } from "@/lib/http/client";
import {
  getSubmissionApiErrorMessage,
  type ModerationAction,
  moderateSubmission,
} from "@/lib/submission-moderation-api";
import {
  getSubmissionCode,
  isApprovedStatus,
  isProofSubmitted,
  needsProofRequest,
  normalizeReason,
  validateReason,
} from "@/lib/submission-moderation-validation";
import { filterSubmissions } from "@/lib/submission-utils";
import type { Submission, SubmissionStatus } from "@/types/submission";

function needsApprovalReason(submission: Submission) {
  return submission.isAiFlagged || submission.status === "SUSPICIOUS";
}

const statusLabels: Record<SubmissionStatus, string> = {
  PENDING_AI: "Pending AI",
  FLAGGED: "Bị cờ",
  SUSPICIOUS: "Bị cờ",
  APPROVED: "Đã duyệt",
  DISQUALIFIED: "Đã từ chối",
  PROOF_REQUESTED: "Chờ đối chứng",
  PROOF_SUBMITTED: "Đã nộp bằng chứng",
  WITHDRAWN: "Đã rút bài",
  APPROVED_FOR_JUDGING: "Đã duyệt",
  DISQUALIFIED_NO_PROOF: "Đã từ chối",
};

// DTO thực tế của GET /api/v1/submissions (apps/api/src/routes/submissions.ts).
type ApiSubmission = {
  id: string;
  participantId: string;
  authorName?: string;
  title: string;
  status: SubmissionStatus;
  aiFlagged: boolean;
  createdAt: string;
  code?: string | null;
  submissionCode?: string | null;
  proofRequestedAt?: string | null;
  proofDeadlineAt?: string | null;
  proofSubmittedAt?: string | null;
  negativeProofPath?: string | null;
  proofReviewStatus?: "PENDING" | "VALID" | "INVALID" | string | null;
  categoryRequiresProofUpfront?: boolean | null;
};

type SubmissionListResponse = {
  data: ApiSubmission[];
};

function mapApiToSubmission(api: ApiSubmission): Submission {
  return {
    id: api.id,
    authorName: api.authorName || api.participantId || "Thí sinh ẩn danh",
    title: api.title,
    submittedAt: api.createdAt,
    isAiFlagged: api.aiFlagged,
    status: api.status,
    code: api.code,
    submissionCode: api.submissionCode,
    proofRequestedAt: api.proofRequestedAt,
    proofDeadlineAt: api.proofDeadlineAt,
    proofSubmittedAt: api.proofSubmittedAt,
    negativeProofPath: api.negativeProofPath,
    proofReviewStatus: api.proofReviewStatus,
    categoryRequiresProofUpfront: api.categoryRequiresProofUpfront,
  };
}

type SubmissionTableProps = {
  contestId: string;
};

export default function SubmissionTable({ contestId }: SubmissionTableProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null,
  );
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [aiFilter, setAiFilter] = useState<"all" | "true" | "false">("all");
  const [scanQueuedIds, setScanQueuedIds] = useState<string[]>([]);
  const [scanJobs, setScanJobs] = useState<Record<string, string>>({});
  const [batchScanning, setBatchScanning] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [pendingStatus, setPendingStatus] = useState<SubmissionStatus | null>(
    null,
  );
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [requestProofTarget, setRequestProofTarget] =
    useState<Submission | null>(null);
  const [proofReviewTarget, setProofReviewTarget] = useState<Submission | null>(
    null,
  );
  const [verifiedProofIds, setVerifiedProofIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setIsLoading(true);
        const params: Record<string, string | number | boolean> = {
          contestId,
          limit: 100,
        };
        if (aiFilter !== "all") params.aiFlagged = aiFilter === "true";
        const res = await http.get<SubmissionListResponse>(
          "/api/v1/submissions",
          { params },
        );
        const raw = (res.data as { data?: unknown }).data ?? res.data;
        const wrappedItems = (raw as { items?: ApiSubmission[] })?.items;
        const list = Array.isArray(raw)
          ? (raw as ApiSubmission[])
          : Array.isArray(wrappedItems)
            ? wrappedItems
            : [];
        setSubmissions(list.map(mapApiToSubmission));
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
        toast.error("Không thể tải danh sách bài dự thi.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubmissions();
  }, [contestId, aiFilter]);

  const visibleSubmissions = filterSubmissions(submissions, query);
  const findSubmission = (id: string) =>
    submissions.find((submission) => submission.id === id) ?? null;
  const hasVerifiedProof = (submission: Submission) =>
    submission.proofReviewStatus === "VALID" ||
    verifiedProofIds.includes(submission.id);

  const openComparison = (id: string) => {
    setSelectedSubmission(id);
    setIsModalOpen(true);
  };

  const queueSingleScan = async (id: string) => {
    setRowLoadingId(id);
    try {
      const result = await triggerSingleAiScan(id);
      setScanQueuedIds((prev) =>
        prev.includes(id) ? prev : [...prev, id],
      );
      setScanJobs((prev) => ({ ...prev, [id]: result.jobId }));
      toast.success(
        `Đã xếp hàng quét AI cho bài ${id}. Mã job: ${result.jobId}.`,
      );
    } catch (error) {
      toast.error(getAiErrorMessage(error));
    } finally {
      setRowLoadingId(null);
    }
  };

  const queueBatchScan = async () => {
    if (selectedRows.length === 0) return;
    setBatchScanning(true);
    try {
      const result = await triggerBatchAiScan({
        contestId,
        submissionIds: selectedRows,
      });
      setScanQueuedIds((prev) => [
        ...prev,
        ...selectedRows.filter((id) => !prev.includes(id)),
      ]);
      toast.success(`Đã xếp hàng ${result.queuedCount} bài để quét AI.`);
      setSelectedRows([]);
    } catch (error) {
      toast.error(getAiErrorMessage(error));
    } finally {
      setBatchScanning(false);
    }
  };

  const allVisibleSelected =
    visibleSubmissions.length > 0 &&
    visibleSubmissions.every((s) => selectedRows.includes(s.id));

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setSelectedRows(
      allVisibleSelected ? [] : visibleSubmissions.map((s) => s.id),
    );
  };

  const openModerationDialog = (ids: string[], status: SubmissionStatus) => {
    if (status === "APPROVED") {
      const hasUnverifiedProof = ids.some((id) => {
        const submission = findSubmission(id);
        return submission
          ? isProofSubmitted(submission) && !hasVerifiedProof(submission)
          : false;
      });
      if (hasUnverifiedProof) {
        toast.error("Cần xác minh bằng chứng trước khi duyệt bài.");
        return;
      }
    }
    setPendingIds(ids);
    setPendingStatus(status);
  };

  const applyModeration = async (ids: string[], status: SubmissionStatus) => {
    if (ids.length === 0) {
      return;
    }

    const action: ModerationAction =
      status === "APPROVED" ? "APPROVE_FOR_JUDGING" : "DISQUALIFY";
    const nextStatus: SubmissionStatus =
      status === "APPROVED" ? "APPROVED_FOR_JUDGING" : "DISQUALIFIED";
    const reason = normalizeReason(moderationReason);
    const verb = status === "APPROVED" ? "duyệt" : "từ chối";

    setIsBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => moderateSubmission(id, action, reason)),
      );

      const succeededIds = ids.filter(
        (_, index) => results[index].status === "fulfilled",
      );
      const failedResult = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );

      if (succeededIds.length > 0) {
        setSubmissions((prev) =>
          prev.map((s) =>
            succeededIds.includes(s.id) ? { ...s, status: nextStatus } : s,
          ),
        );
        setSelectedRows((prev) =>
          prev.filter((id) => !succeededIds.includes(id)),
        );
      }

      if (failedResult) {
        toast.error(
          `Đã ${verb} ${succeededIds.length}/${ids.length} bài thi. ${getSubmissionApiErrorMessage(
            failedResult.reason,
          )}`,
        );
      } else if (status === "APPROVED" && succeededIds.length === 1) {
        const approved = findSubmission(succeededIds[0]);
        const code = approved ? getSubmissionCode(approved) : succeededIds[0];
        toast.success(
          `Đã phê duyệt tác phẩm ${code} vào danh sách chấm thi chính thức.`,
        );
      } else {
        toast.success(`Đã ${verb} ${succeededIds.length} bài thi.`);
      }
    } catch (err: unknown) {
      toast.error(getSubmissionApiErrorMessage(err));
    } finally {
      setIsBulkLoading(false);
      setPendingStatus(null);
      setPendingIds([]);
      setModerationReason("");
    }
  };

  const approveSingle = async (id: string) => {
    const target = findSubmission(id);
    if (!target) return;

    if (isProofSubmitted(target) && !hasVerifiedProof(target)) {
      setProofReviewTarget(target);
      return;
    }
    if (needsApprovalReason(target)) {
      openModerationDialog([id], "APPROVED");
      return;
    }

    setRowLoadingId(id);
    try {
      await moderateSubmission(id, "APPROVE_FOR_JUDGING");
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "APPROVED_FOR_JUDGING" } : s,
        ),
      );
      toast.success(
        `Đã phê duyệt tác phẩm ${getSubmissionCode(target)} vào danh sách chấm thi chính thức.`,
      );
    } catch (err: unknown) {
      toast.error(getSubmissionApiErrorMessage(err));
    } finally {
      setRowLoadingId(null);
    }
  };

  const requiresReason =
    pendingStatus === "DISQUALIFIED" ||
    submissions.some(
      (item) => pendingIds.includes(item.id) && needsApprovalReason(item),
    );
  const reasonValidationError = validateReason(moderationReason);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              // Đổi từ khóa thì bỏ chọn, tránh "đã chọn N" mà không thấy checkbox nào.
              setQuery(event.target.value);
              setSelectedRows([]);
            }}
            placeholder="Tìm theo tên thí sinh..."
            className="pl-8"
            aria-label="Tìm theo tên thí sinh"
          />
        </div>

        <select
          aria-label="Lọc theo cảnh báo AI"
          value={aiFilter}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          onChange={(event) => {
            setAiFilter(event.target.value as "all" | "true" | "false");
            setSelectedRows([]);
          }}
        >
          <option value="all">Tất cả</option>
          <option value="true">Có cờ AI</option>
          <option value="false">Không cờ AI</option>
        </select>

        {selectedRows.length > 0 ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Đã chọn {selectedRows.length}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={isBulkLoading || batchScanning}
              onClick={() => void queueBatchScan()}
            >
              <Sparkles />
              Quét AI hàng loạt
            </Button>
            <Button
              size="sm"
              disabled={isBulkLoading}
              onClick={() => openModerationDialog(selectedRows, "APPROVED")}
            >
              <Check />
              Duyệt hàng loạt
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isBulkLoading}
              onClick={() => openModerationDialog(selectedRows, "DISQUALIFIED")}
            >
              <X />
              Từ chối hàng loạt
            </Button>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        BR-19 (SRS): hạn do Organizer đặt; quá hạn chờ Organizer xử lý thủ công,
        không tự động loại.
      </p>

      <div className="overflow-hidden rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Chọn tất cả bài dự thi"
                  checked={
                    allVisibleSelected
                      ? true
                      : selectedRows.length > 0
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Mã bài thi</TableHead>
              <TableHead>Tên thí sinh / Nhóm</TableHead>
              <TableHead>Tên bài dự thi</TableHead>
              <TableHead>Ngày nộp</TableHead>
              <TableHead>Trạng thái / Đối chứng</TableHead>
              <TableHead>Cảnh báo AI</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : visibleSubmissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không tìm thấy bài dự thi nào.
                </TableCell>
              </TableRow>
            ) : (
              visibleSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Chọn bài dự thi ${submission.id}`}
                      checked={selectedRows.includes(submission.id)}
                      onCheckedChange={() => toggleRow(submission.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {submission.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {submission.authorName}
                  </TableCell>
                  <TableCell>{submission.title}</TableCell>
                  <TableCell>
                    {formatContestDate(submission.submittedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-2">
                      <Badge
                        className={
                          isApprovedStatus(submission.status)
                            ? "bg-green-600 text-white"
                            : submission.status === "DISQUALIFIED" ||
                                submission.status === "DISQUALIFIED_NO_PROOF"
                              ? "bg-red-500 text-white"
                              : submission.status === "FLAGGED" ||
                                  submission.status === "SUSPICIOUS"
                                ? "bg-amber-500 text-white"
                                : ""
                        }
                      >
                        {statusLabels[submission.status]}
                      </Badge>
                      {isProofSubmitted(submission) &&
                      hasVerifiedProof(submission) ? (
                        <Badge
                          variant="outline"
                          className="border-green-300 text-green-700"
                        >
                          Đã xác minh
                        </Badge>
                      ) : null}
                      {submission.proofDeadlineAt ? (
                        <LiveCountdown48h
                          proofDeadline={submission.proofDeadlineAt}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {needsApprovalReason(submission) && (
                        <Badge className="bg-red-500 text-white">
                          <AlertTriangle className="size-3.5" />
                          Cảnh báo AI
                        </Badge>
                      )}
                      {submission.aiAnalysis?.aiGeneratedProbability != null && (
                        <Badge variant="ai-warning" className="text-[10px]">
                          AI {Math.round((submission.aiAnalysis.aiGeneratedProbability ?? 0) * 100)}%
                        </Badge>
                      )}
                      {submission.aiAnalysis?.duplicateSimilarityScore != null && (
                        <Badge variant="ai-warning" className="text-[10px]">
                          Trùng {Math.round((submission.aiAnalysis.duplicateSimilarityScore ?? 0) * 100)}%
                        </Badge>
                      )}
                      {submission.aiAnalysis?.flagReasons?.includes("DEMO_FIXTURE") && (
                        <Badge variant="outline" className="text-[10px]">
                          Demo fixture
                        </Badge>
                      )}
                      {scanQueuedIds.includes(submission.id) && (
                        <Badge variant="brand" className="text-[10px]">
                          Đã xếp hàng quét AI
                          {scanJobs[submission.id]
                            ? ` · ${scanJobs[submission.id]}`
                            : null}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openComparison(submission.id)}
                      >
                        <Eye className="size-4" />
                        Thẩm định
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rowLoadingId === submission.id}
                        onClick={() => void queueSingleScan(submission.id)}
                      >
                        <Sparkles className="size-4" />
                        Quét AI
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isApprovedStatus(submission.status) ? (
                      <Badge className="bg-green-600 text-white">
                        Đã duyệt
                      </Badge>
                    ) : submission.status === "DISQUALIFIED" ||
                      submission.status === "DISQUALIFIED_NO_PROOF" ? (
                      <Badge className="bg-red-500 text-white">
                        Đã từ chối
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-2">
                        {isProofSubmitted(submission) &&
                        !hasVerifiedProof(submission) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rowLoadingId === submission.id}
                            onClick={() => setProofReviewTarget(submission)}
                          >
                            <ShieldCheck />
                            Xác minh &amp; duyệt
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={rowLoadingId === submission.id}
                            onClick={() => void approveSingle(submission.id)}
                          >
                            <Check />
                            Duyệt
                          </Button>
                        )}
                        {needsProofRequest(submission) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rowLoadingId === submission.id}
                            onClick={() => setRequestProofTarget(submission)}
                          >
                            <FileClock className="size-4" />
                            {submission.status === "PROOF_REQUESTED"
                              ? "Gửi lại yêu cầu"
                              : "Yêu cầu đối chứng"}
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={rowLoadingId === submission.id}
                          onClick={() =>
                            openModerationDialog(
                              [submission.id],
                              "DISQUALIFIED",
                            )
                          }
                        >
                          <X />
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ImageComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submissionId={selectedSubmission}
      />

      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatus(null);
            setPendingIds([]);
            setModerationReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === "APPROVED" ? "Duyệt" : "Từ chối"}
              {pendingIds.length > 1 ? " hàng loạt" : " bài thi"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn{" "}
              {pendingStatus === "APPROVED" ? "duyệt" : "từ chối"}{" "}
              {pendingIds.length} bài thi đã chọn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {requiresReason ? (
            <div className="space-y-2">
              <Label htmlFor="moderation-reason">
                {pendingStatus === "DISQUALIFIED"
                  ? "Lý do loại bài"
                  : "Lý do gỡ cờ"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="moderation-reason"
                rows={3}
                minLength={10}
                maxLength={1000}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Nhập lý do quyết định (10–1000 ký tự)"
                value={moderationReason}
                onChange={(event) => setModerationReason(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Bắt buộc theo BR-18 — hiện tại{" "}
                {normalizeReason(moderationReason).length}/10 ký tự tối thiểu.
              </p>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                isBulkLoading ||
                (requiresReason && reasonValidationError !== null)
              }
              onClick={() => {
                if (pendingStatus) applyModeration(pendingIds, pendingStatus);
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RequestProofModal
        open={requestProofTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRequestProofTarget(null);
        }}
        submission={
          requestProofTarget
            ? { id: requestProofTarget.id, title: requestProofTarget.title }
            : null
        }
        onSuccess={(result) => {
          const targetId = requestProofTarget?.id;
          if (targetId) {
            setSubmissions((prev) =>
              prev.map((s) =>
                s.id === targetId
                  ? {
                      ...s,
                      status: result.status ?? "PROOF_REQUESTED",
                      proofRequestedAt:
                        result.proofRequestedAt ?? s.proofRequestedAt ?? null,
                      proofDeadlineAt:
                        result.proofDeadlineAt ?? s.proofDeadlineAt ?? null,
                    }
                  : s,
              ),
            );
          }
          setSelectedRows((prev) => prev.filter((id) => id !== targetId));
          setRequestProofTarget(null);
        }}
      />

      <ProofReviewModal
        open={proofReviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setProofReviewTarget(null);
        }}
        submission={proofReviewTarget}
        onApproved={(id, status) => {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status } : s)),
          );
          setVerifiedProofIds((prev) => [...new Set([...prev, id])]);
          setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
          setProofReviewTarget(null);
        }}
      />
    </div>
  );
}
