"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | null;
}

interface ComparisonSubmission {
  id: string;
  title: string;
  participantId: string;
  authorName?: string | null;
  imageOriginalPath: string | null;
  imagePreviewPath: string | null;
}

interface ComparisonData {
  flaggedSubmission: ComparisonSubmission;
  originalSubmission: ComparisonSubmission | null;
  duplicateCheck: {
    hammingDistance: number;
  } | null;
  aiGeneratedProbability: number | null;
}

// Backend mới trả storage key, chưa có presigned URL → key không load được trong <img>.
const imageSrc = (path: string | null, fallback: string) =>
  path && /^(https?:\/\/|\/)/.test(path) ? path : fallback;

export default function ImageComparisonModal({
  isOpen,
  onClose,
  submissionId,
}: ImageComparisonModalProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !submissionId) {
      setData(null);
      setError(null);
      return;
    }

    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/submissions/${submissionId}/comparison`,
        );

        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu so sánh");
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [isOpen, submissionId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>So sánh bài dự thi nghi ngờ trùng lặp</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && !data && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Không có dữ liệu so sánh.
          </p>
        )}

        {!loading && !error && data && (
          <>
            {data.originalSubmission ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Bài dự thi gốc</h3>
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">
                      Mã: {data.originalSubmission.id}
                    </p>
                    <p className="text-sm font-medium">
                      {data.originalSubmission.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.originalSubmission.authorName ?? "Thí sinh ẩn danh"}
                    </p>
                  </div>
                  <img
                    src={imageSrc(
                      data.originalSubmission.imagePreviewPath,
                      "https://placehold.co/600x400?text=Anh+Goc",
                    )}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "https://placehold.co/600x400?text=Anh+Goc";
                    }}
                    alt={data.originalSubmission.title}
                    className="h-[400px] w-full rounded-md border object-contain"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">
                    Bài dự thi bị nghi ngờ
                  </h3>
                  <div className="space-y-2 rounded-md border bg-red-50 p-3">
                    <p className="text-xs text-muted-foreground">
                      Mã: {data.flaggedSubmission.id}
                    </p>
                    <p className="text-sm font-medium">
                      {data.flaggedSubmission.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.flaggedSubmission.authorName ?? "Thí sinh ẩn danh"}
                    </p>
                    {data.duplicateCheck && (
                      <p className="text-xs font-medium text-red-600">
                        Độ tương đồng: {data.duplicateCheck.hammingDistance}
                      </p>
                    )}
                    {data.aiGeneratedProbability !== null && (
                      <p className="text-xs font-medium text-orange-600">
                        AI: {(data.aiGeneratedProbability * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <img
                    src={imageSrc(
                      data.flaggedSubmission.imagePreviewPath,
                      "https://placehold.co/600x400?text=Anh+Nghi+Ngo",
                    )}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "https://placehold.co/600x400?text=Anh+Nghi+Ngo";
                    }}
                    alt={data.flaggedSubmission.title}
                    className="h-[400px] w-full rounded-md border object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">
                    Bài dự thi bị nghi ngờ
                  </h3>
                  <div className="space-y-2 rounded-md border bg-yellow-50 p-3">
                    <p className="text-xs text-muted-foreground">
                      Mã: {data.flaggedSubmission.id}
                    </p>
                    <p className="text-sm font-medium">
                      {data.flaggedSubmission.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.flaggedSubmission.authorName ?? "Thí sinh ẩn danh"}
                    </p>
                    {data.aiGeneratedProbability !== null && (
                      <p className="text-xs font-medium text-orange-600">
                        AI: {(data.aiGeneratedProbability * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <img
                    src={imageSrc(
                      data.flaggedSubmission.imagePreviewPath,
                      "https://placehold.co/600x400?text=Anh+Nghi+Ngo",
                    )}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "https://placehold.co/600x400?text=Anh+Nghi+Ngo";
                    }}
                    alt={data.flaggedSubmission.title}
                    className="mx-auto h-[400px] max-w-2xl rounded-md border object-contain"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Không tìm thấy bài dự thi trùng lặp
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={onClose}>Đóng</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
