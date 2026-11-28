"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Eye,
  Images,
  RefreshCw,
  Trash2,
  Undo2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArchiveSubmissionsDialog } from "@/components/exhibition/archive-submissions-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildProcessExhibitionInput,
  deleteExhibition,
  getContestExhibitions,
  getExhibitionErrorMessage,
  getExhibitionImageUrl,
  isAbortError,
  processExhibition,
  resolveExhibitionImageUrl,
  updateExhibitionStatus,
} from "@/lib/exhibition-api";
import type {
  ContestExhibitionItem,
  ExhibitionStatus,
} from "@/types/exhibition";

const MSG028 =
  "Đã xuất bản tác phẩm vào Kho lưu trữ số và Phòng triển lãm trực tuyến.";

const STATUS_LABELS: Record<ExhibitionStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  READY: "Sẵn sàng",
  PUBLISHED: "Đã công bố",
  FAILED: "Thất bại",
  ARCHIVED: "Đã lưu trữ",
};

const STATUS_VARIANTS: Record<
  ExhibitionStatus,
  "secondary" | "approved" | "valid" | "disqualified" | "outline"
> = {
  PENDING: "secondary",
  PROCESSING: "approved",
  READY: "valid",
  PUBLISHED: "valid",
  FAILED: "disqualified",
  ARCHIVED: "outline",
};

function formatUpdatedAt(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function cssUrl(value: string): string {
  return `url(${JSON.stringify(value)})`;
}

export function ContestExhibitionManager({
  contestId,
  contestName,
  status,
}: {
  contestId: string;
  contestName: string;
  status: string;
}) {
  const [items, setItems] = useState<ContestExhibitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const normalizedStatus = (status ?? "").toLowerCase();
  const canArchive =
    normalizedStatus === "published" ||
    normalizedStatus === "results_published";

  const loadItems = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getContestExhibitions(contestId, signal);
        setItems(data ?? []);
      } catch (err: unknown) {
        if (signal?.aborted || isAbortError(err)) return;
        setError(getExhibitionErrorMessage(err));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [contestId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadItems(controller.signal);
    return () => controller.abort();
  }, [loadItems]);

  function handleArchiveClick() {
    if (!canArchive) {
      toast.error(
        "Cần công bố kết quả chính thức (PUBLISHED) trước khi đưa tác phẩm vào triển lãm.",
      );
      return;
    }
    setArchiveOpen(true);
  }

  function handlePreview(item: ContestExhibitionItem) {
    window.open(
      getExhibitionImageUrl(item.imageUrl, item.id),
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleProcess(item: ContestExhibitionItem) {
    setBusyId(item.id);
    try {
      await processExhibition(item.id, buildProcessExhibitionInput({ publish: false }));
      toast.success("Đã yêu cầu xử lý tác phẩm theo BR-17.");
      await loadItems();
    } catch (err: unknown) {
      if (!isAbortError(err)) toast.error(getExhibitionErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatus(
    item: ContestExhibitionItem,
    nextStatus: "PUBLISHED" | "READY",
    successMessage: string,
  ) {
    setBusyId(item.id);
    try {
      await updateExhibitionStatus(item.id, { status: nextStatus });
      toast.success(successMessage);
      await loadItems();
    } catch (err: unknown) {
      if (!isAbortError(err)) toast.error(getExhibitionErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnpublish(item: ContestExhibitionItem) {
    const confirmed = window.confirm(
      `Gỡ công khai tác phẩm "${item.title}" khỏi triển lãm? Tác phẩm sẽ trở về trạng thái READY.`,
    );
    if (!confirmed) return;
    await handleStatus(item, "READY", "Đã gỡ công khai tác phẩm.");
  }

  async function handleDelete(item: ContestExhibitionItem) {
    const confirmed = window.confirm(
      `Xóa mềm tác phẩm "${item.title}"? Theo BR-03, bản ghi vẫn được giữ lại với trạng thái ARCHIVED và chỉ biến mất khỏi gallery công khai.`,
    );
    if (!confirmed) return;

    setBusyId(item.id);
    try {
      await deleteExhibition(item.id);
      toast.success("Đã xóa mềm tác phẩm theo BR-03.");
      await loadItems();
    } catch (err: unknown) {
      if (!isAbortError(err)) toast.error(getExhibitionErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            href={`/portal/contests/${contestId}`}
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại cuộc thi
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Quản lý triển lãm — {contestName}
            </h1>
            <Badge variant="brand">
              {(normalizedStatus || "draft").toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/archive?contestId=${contestId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Xem triển lãm công
              khai
            </Button>
          </Link>
          <Button size="sm" onClick={handleArchiveClick}>
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Đưa tác phẩm vào
            triển lãm
          </Button>
        </div>
      </div>

      {!canArchive ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Cuộc thi chưa ở trạng thái PUBLISHED. Hãy công bố kết quả chính thức
            trước khi đưa tác phẩm vào triển lãm (BR-16).
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">
              Không thể tải danh sách triển lãm.
            </p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadItems()}
            disabled={loading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Thử lại
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải danh sách tác
          phẩm triển lãm...
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<Images className="h-8 w-8" />}
          title="Chưa có tác phẩm triển lãm"
          description="Chọn tác phẩm từ kết quả chính thức để đưa vào Kho lưu trữ số và Phòng triển lãm trực tuyến."
          action={
            canArchive
              ? {
                  label: "Đưa tác phẩm vào triển lãm",
                  onClick: handleArchiveClick,
                }
              : undefined
          }
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Tác phẩm</th>
                <th className="px-3 py-2">Mã bài</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Watermark</th>
                <th className="px-3 py-2">Bản quyền</th>
                <th className="px-3 py-2">Cập nhật</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        role="img"
                        aria-label={`Ảnh tác phẩm ${item.title}`}
                        className="h-10 w-14 rounded bg-slate-100 bg-cover bg-center ring-1 ring-slate-200"
                        style={{
                          backgroundImage: cssUrl(
                            resolveExhibitionImageUrl(item.imageUrl, item.id),
                          ),
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {item.title}
                        </p>
                        {item.author ? (
                          <p className="truncate text-xs text-slate-500">
                            {item.author}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">
                    {item.submissionId}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_VARIANTS[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                    {item.errorMessage ? (
                      <p className="mt-1 max-w-xs text-xs text-red-600">
                        {item.errorMessage}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={item.watermarked ? "valid" : "outline"}>
                      {item.watermarked ? "Có" : "Không"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {item.copyright?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {formatUpdatedAt(item.updatedAt)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handlePreview(item)}
                      >
                        <Eye className="h-3 w-3" /> Xem trước
                      </Button>
                      {item.status !== "PUBLISHED" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          disabled={busyId === item.id}
                          onClick={() => void handleProcess(item)}
                        >
                          <RefreshCw className="h-3 w-3" /> Xử lý/Retry
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={
                          busyId === item.id ||
                          item.status === "PUBLISHED" ||
                          item.status === "ARCHIVED"
                        }
                        onClick={() =>
                          void handleStatus(item, "PUBLISHED", MSG028)
                        }
                      >
                        <UploadCloud className="h-3 w-3" /> Công bố
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={
                          busyId === item.id || item.status !== "PUBLISHED"
                        }
                        onClick={() => void handleUnpublish(item)}
                      >
                        <Undo2 className="h-3 w-3" /> Gỡ công khai
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        disabled={
                          busyId === item.id || item.status === "ARCHIVED"
                        }
                        onClick={() => void handleDelete(item)}
                      >
                        <Trash2 className="h-3 w-3" /> Xóa mềm
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ArchiveSubmissionsDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        contestId={contestId}
        existingSubmissionIds={items.map((item) => item.submissionId)}
        onSuccess={() => void loadItems()}
      />
    </div>
  );
}
