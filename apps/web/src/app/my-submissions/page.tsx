"use client";

import {
  AlertCircle,
  ArrowLeft,
  Eye,
  FilePlus2,
  Search,
  Trophy,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Footer } from "@/components/home/footer";
import { Navbar } from "@/components/home/navbar";
import { SubmissionResultDialog } from "@/components/results/submission-result-dialog";
import { LiveCountdown48h } from "@/components/submission/live-countdown-48h";
import { ModerationPipelineTimeline } from "@/components/submission/moderation-pipeline-timeline";
import { RejectionDetailsModal } from "@/components/submission/rejection-details-modal";
import { UploadNegativeProofModal } from "@/components/submission/upload-negative-proof-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { http } from "@/lib/http/client";
import type { MySubmissionItem } from "@/types/my-submission";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING_AI: {
    label: "Đang quét AI",
    className: "bg-slate-100 text-slate-700",
  },
  AI_VERIFIED: { label: "AI hợp lệ", className: "bg-blue-100 text-blue-700" },
  AI_FLAGGED: {
    label: "Cảnh báo AI",
    className: "bg-amber-100 text-amber-800",
  },
  PROOF_REQUESTED: {
    label: "Chờ nộp âm bản",
    className: "bg-orange-100 text-orange-800",
  },
  APPROVED: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-700" },
  JUDGING: {
    label: "Đang chấm thi",
    className: "bg-indigo-100 text-indigo-700",
  },
  REJECTED: { label: "Bị từ chối", className: "bg-red-100 text-red-700" },
  DISQUALIFIED: { label: "Bị loại", className: "bg-red-100 text-red-700" },
};

export default function MySubmissionsPage() {
  const [items, setItems] = useState<MySubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [zoomItem, setZoomItem] = useState<MySubmissionItem | null>(null);
  const [proofItem, setProofItem] = useState<MySubmissionItem | null>(null);
  const [rejectItem, setRejectItem] = useState<MySubmissionItem | null>(null);
  const [resultTarget, setResultTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const fetchMySubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await http.get("/api/v1/submissions/my");
      const raw = res.data?.data ?? res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : [];
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMySubmissions();
  }, [fetchMySubmissions]);

  const filtered = items.filter((item) => {
    const matchStatus =
      statusFilter === "ALL" ||
      item.status === statusFilter ||
      (statusFilter === "DISQUALIFIED" && item.status === "REJECTED");
    const matchSearch =
      !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.contestTitle ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Về trang chủ
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bài thi của tôi
            </h1>
            <p className="text-sm text-slate-500">
              Theo dõi trạng thái bài dự thi và yêu cầu bổ sung bằng chứng.
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/submissions/new">
              <FilePlus2 className="mr-1.5 h-4 w-4" />
              Nộp bài mới
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo tên tác phẩm hoặc cuộc thi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING_AI">Đang quét AI</option>
            <option value="PROOF_REQUESTED">Chờ nộp âm bản</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="JUDGING">Đang chấm thi</option>
            <option value="DISQUALIFIED">Bị loại</option>
          </select>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-slate-500">
              Đang tải danh sách bài dự thi...
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <p className="text-sm text-slate-600">
                Bạn chưa có bài dự thi nào (hoặc chưa đăng nhập tài khoản Thí
                sinh).
              </p>
              <Button asChild variant="outline">
                <Link href="/submissions/new">Nộp tác phẩm đầu tiên</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((item) => {
              const badge = STATUS_BADGE[item.status] ?? {
                label: item.status,
                className: "bg-slate-100 text-slate-700",
              };
              const isRejected =
                item.status === "REJECTED" || item.status === "DISQUALIFIED";
              const needsProof =
                item.status === "PROOF_REQUESTED" ||
                Boolean(item.proofDeadline);

              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-900">
                            {item.title}
                          </h2>
                          <Badge className={badge.className}>
                            {badge.label}
                          </Badge>
                          {item.aiFlagged ? (
                            <Badge className="bg-amber-100 text-amber-800">
                              Cờ AI / Trùng lặp
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500">
                          Cuộc thi: {item.contestTitle || item.contestId}
                          {item.filmMetadata?.filmStock
                            ? ` • ${item.filmMetadata.filmStock}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.imagePreviewPath || item.imageOriginalPath ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setZoomItem(item)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Xem ảnh
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setResultTarget({ id: item.id, title: item.title })
                          }
                        >
                          <Trophy className="mr-1.5 h-3.5 w-3.5" />
                          Xem kết quả
                        </Button>

                        {needsProof ? (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => setProofItem(item)}
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            Nộp âm bản
                          </Button>
                        ) : null}

                        {isRejected ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setRejectItem(item)}
                          >
                            <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                            Xem lý do từ chối
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {needsProof && item.proofDeadline ? (
                      <LiveCountdown48h proofDeadline={item.proofDeadline} />
                    ) : null}

                    <ModerationPipelineTimeline status={item.status} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal phóng to ảnh */}
        <Dialog
          open={Boolean(zoomItem)}
          onOpenChange={(open) => !open && setZoomItem(null)}
        >
          <DialogContent className="max-w-3xl bg-white">
            <DialogHeader>
              <DialogTitle>{zoomItem?.title}</DialogTitle>
            </DialogHeader>
            {zoomItem ? (
              <img
                src={
                  zoomItem.imagePreviewPath || zoomItem.imageOriginalPath || ""
                }
                alt={zoomItem.title}
                className="max-h-[70vh] w-full rounded object-contain"
              />
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Modal nộp âm bản */}
        {proofItem ? (
          <UploadNegativeProofModal
            open={Boolean(proofItem)}
            onOpenChange={(open) => !open && setProofItem(null)}
            submissionId={proofItem.id}
            submissionTitle={proofItem.title}
            onSuccess={fetchMySubmissions}
          />
        ) : null}

        {/* Modal chi tiết lý do từ chối */}
        {rejectItem ? (
          <RejectionDetailsModal
            open={Boolean(rejectItem)}
            onOpenChange={(open) => !open && setRejectItem(null)}
            submissionTitle={rejectItem.title}
            rejectionReason={rejectItem.rejectionReason}
            aiFlagged={rejectItem.aiFlagged}
          />
        ) : null}

        {resultTarget ? (
          <SubmissionResultDialog
            open={Boolean(resultTarget)}
            onOpenChange={(open) => !open && setResultTarget(null)}
            submissionId={resultTarget.id}
            title={resultTarget.title}
          />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
