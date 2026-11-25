"use client";

import axios from "axios";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { http } from "@/lib/http/client";

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
  negativeProofPath: string | null;
}

interface ComparisonData {
  flaggedSubmission: ComparisonSubmission;
  originalSubmission: ComparisonSubmission | null;
  duplicateCheck: {
    similarityScore: number | null;
  } | null;
  aiGeneratedProbability: number | null;
  predictedTags: { tag: string; confidence: number }[];
}

type ComparisonResponse = {
  data: ComparisonData | null;
};

type ApiErrorBody = { message?: string };

function ReviewImage({ src, label }: { src: string | null; label: string }) {
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-semibold">{label}</figcaption>
      {src ? (
        <img src={src} alt={label} className="h-64 w-full rounded-md border object-contain" />
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có ảnh.</p>
      )}
    </figure>
  );
}

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
        // Axios interceptor tự gắn Authorization Bearer (access token trong memory).
        const response = await http.get<ComparisonResponse>(
          `/api/v1/submissions/${submissionId}/comparison`,
        );
        setData(response.data.data);
      } catch (err) {
        setError(
          axios.isAxiosError<ApiErrorBody>(err)
            ? (err.response?.data?.message ?? "Không thể tải dữ liệu so sánh")
            : err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [isOpen, submissionId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thẩm định bài dự thi</DialogTitle>
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
            <div className="space-y-1 text-sm">
              <p className="font-medium">{data.flaggedSubmission.title}</p>
              {data.aiGeneratedProbability !== null && (
                <p>Điểm nghi vấn AI {(data.aiGeneratedProbability * 100).toFixed(1)}%</p>
              )}
              {data.duplicateCheck?.similarityScore != null && (
                <p>Độ tương đồng {(data.duplicateCheck.similarityScore * 100).toFixed(1)}%</p>
              )}
              {data.predictedTags.length > 0 && (
                <p>Thẻ gợi ý · {data.predictedTags.map(({ tag }) => tag).join(", ")}</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ReviewImage src={data.flaggedSubmission.imagePreviewPath} label="Ảnh dự thi" />
              <ReviewImage src={data.flaggedSubmission.negativeProofPath} label="Âm bản hoặc contact sheet" />
            </div>
            {data.originalSubmission && (
              <ReviewImage src={data.originalSubmission.imagePreviewPath} label={`Ảnh tương tự · ${data.originalSubmission.title}`} />
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
