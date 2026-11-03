"use client";

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

// TODO: Đổi sang POST /api/v1/submissions/bulk khi BE hoàn thiện.
async function bulkUpdateStatus(
  _ids: string[],
  _status: SubmissionStatus,
): Promise<void> {}

export default function SubmissionTable() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null,
  );
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [pendingStatus, setPendingStatus] = useState<SubmissionStatus | null>(
    null,
  );
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setIsLoading(true);
        const res = await http.get("/api/v1/submissions", {
          params: { limit: 100 },
        });
        if (res.data?.data) {
          setSubmissions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const visibleSubmissions = filterSubmissions(submissions, query);

  const updateStatus = (id: string, status: SubmissionStatus) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  };

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

  const applyBulk = async (status: SubmissionStatus) => {
    setIsBulkLoading(true);
    try {
      await bulkUpdateStatus(selectedRows, status);
      setSubmissions((prev) =>
        prev.map((s) => (selectedRows.includes(s.id) ? { ...s, status } : s)),
      );
      toast.success(
        `Đã ${status === "APPROVED" ? "duyệt" : "từ chối"} ${selectedRows.length} bài thi.`,
      );
      setSelectedRows([]);
    } catch {
      toast.error("Thao tác hàng loạt thất bại. Vui lòng thử lại.");
    } finally {
      setIsBulkLoading(false);
      setPendingStatus(null);
    }
  };

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
              onClick={() => setPendingStatus("APPROVED")}
            >
              <Check />
              Duyệt hàng loạt
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isBulkLoading}
              onClick={() => setPendingStatus("DISQUALIFIED")}
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
                          onClick={() =>
                            updateStatus(submission.id, "APPROVED")
                          }
                        >
                          <Check />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateStatus(submission.id, "DISQUALIFIED")
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
          if (!open) setPendingStatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === "APPROVED" ? "Duyệt" : "Từ chối"} hàng loạt
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn{" "}
              {pendingStatus === "APPROVED" ? "duyệt" : "từ chối"}{" "}
              {selectedRows.length} bài thi đã chọn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkLoading}
              onClick={() => {
                if (pendingStatus) applyBulk(pendingStatus);
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
