"use client";

import axios from "axios";
import { AlertTriangle, Check, Eye, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import ImageComparisonModal from "@/components/submission/image-comparison-modal";
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
import { formatContestDate } from "@/lib/contest-utils";
import { http } from "@/lib/http/client";
import { filterSubmissions } from "@/lib/submission-utils";
import type { Submission, SubmissionStatus } from "@/types/submission";

type ModerateAction = "APPROVE_FOR_JUDGING" | "DISQUALIFY";

type ModerationErrorBody = { message?: string };

// DTO thực tế của GET /api/v1/submissions (apps/api/src/routes/submissions.ts).
type ApiSubmission = {
  id: string;
  participantId: string;
  authorName?: string;
  title: string;
  status: SubmissionStatus;
  aiFlagged: boolean;
  createdAt: string;
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
  };
}

// Hợp đồng Module 05 §4.5 — mỗi bài thi được kiểm duyệt qua endpoint /moderate.
async function moderateSubmission(
  id: string,
  action: ModerateAction,
  reason?: string,
): Promise<void> {
  await http.post(`/api/v1/submissions/${id}/moderate`, {
    action,
    ...(reason ? { reason } : {}),
  });
}

function getModerationErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ModerationErrorBody>(error)) {
    return (
      error.response?.data?.message ??
      "Không thể kiểm duyệt bài thi. Vui lòng thử lại."
    );
  }

  return error instanceof Error
    ? error.message
    : "Không thể kiểm duyệt bài thi. Vui lòng thử lại.";
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
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [pendingStatus, setPendingStatus] = useState<SubmissionStatus | null>(
    null,
  );
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setIsLoading(true);
        const res = await http.get<SubmissionListResponse>(
          "/api/v1/submissions",
          { params: { contestId, limit: 100 } },
        );
        const raw = (res.data as any)?.data ?? res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
            ? raw.items
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
  }, [contestId]);

  const visibleSubmissions = filterSubmissions(submissions, query);

  const openComparison = (id: string) => {
    setSelectedSubmission(id);
    setIsModalOpen(true);
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
    setPendingIds(ids);
    setPendingStatus(status);
  };

  const applyModeration = async (ids: string[], status: SubmissionStatus) => {
    if (ids.length === 0) {
      return;
    }

    const action: ModerateAction =
      status === "APPROVED" ? "APPROVE_FOR_JUDGING" : "DISQUALIFY";
    const reason = status === "DISQUALIFIED" ? rejectReason.trim() : undefined;
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
          prev.map((s) => (succeededIds.includes(s.id) ? { ...s, status } : s)),
        );
        setSelectedRows((prev) =>
          prev.filter((id) => !succeededIds.includes(id)),
        );
      }

      if (failedResult) {
        toast.error(
          `Đã ${verb} ${succeededIds.length}/${ids.length} bài thi. ${getModerationErrorMessage(
            failedResult.reason,
          )}`,
        );
      } else {
        toast.success(`Đã ${verb} ${succeededIds.length} bài thi.`);
      }
    } catch (err: unknown) {
      toast.error(getModerationErrorMessage(err));
    } finally {
      setIsBulkLoading(false);
      setPendingStatus(null);
      setPendingIds([]);
      setRejectReason("");
    }
  };

  const approveSingle = async (id: string) => {
    setRowLoadingId(id);
    try {
      await moderateSubmission(id, "APPROVE_FOR_JUDGING");
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "APPROVED" } : s)),
      );
      toast.success("Đã duyệt bài thi.");
    } catch (err: unknown) {
      toast.error(getModerationErrorMessage(err));
    } finally {
      setRowLoadingId(null);
    }
  };

  const isRejectReasonInvalid =
    pendingStatus === "DISQUALIFIED" && rejectReason.trim().length < 10;

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

        {selectedRows.length > 0 ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Đã chọn {selectedRows.length}
            </span>
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
              <TableHead>Cảnh báo AI</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : visibleSubmissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                    {submission.isAiFlagged ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500 text-white">
                          <AlertTriangle className="size-3.5" />
                          Cảnh báo AI
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openComparison(submission.id)}
                        >
                          <Eye className="size-4" />
                          So sánh
                        </Button>
                      </div>
                    ) : (
                      <Badge className="bg-green-600 text-white">
                        <Check className="size-3.5" />
                        Hợp lệ
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {submission.status === "APPROVED" ? (
                      <Badge className="bg-green-600 text-white">
                        Đã duyệt
                      </Badge>
                    ) : submission.status === "DISQUALIFIED" ? (
                      <Badge className="bg-red-500 text-white">
                        Đã từ chối
                      </Badge>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={rowLoadingId === submission.id}
                          onClick={() => approveSingle(submission.id)}
                        >
                          <Check />
                          Duyệt
                        </Button>
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
            setRejectReason("");
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
          {pendingStatus === "DISQUALIFIED" ? (
            <div className="space-y-2">
              <Label htmlFor="bulk-reject-reason">
                Lý do từ chối <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="bulk-reject-reason"
                rows={3}
                minLength={10}
                maxLength={1000}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Nêu rõ lý do loại bài thi (tối thiểu 10 ký tự, tối đa 1000 ký tự)..."
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Bắt buộc theo BR-18 — hiện tại {rejectReason.trim().length}/10
                ký tự tối thiểu.
              </p>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkLoading || isRejectReasonInvalid}
              onClick={() => {
                if (pendingStatus) applyModeration(pendingIds, pendingStatus);
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
