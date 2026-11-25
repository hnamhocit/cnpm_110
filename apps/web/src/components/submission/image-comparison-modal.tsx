"use client";

import axios from "axios";
import { Loader2 } from "lucide-react";
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
  filmMetadata?: {
    filmBrand?: string | null;
    filmStock?: string | null;
    cameraBody?: string | null;
    filmFormat?: string | null;
    lens?: string | null;
    isoShot?: number | null;
    frameNumber?: string | null;
  } | null;
}

interface ComparisonData {
  flaggedSubmission: ComparisonSubmission;
  originalSubmission: ComparisonSubmission | null;
  duplicateCheck: {
    similarityScore: number | null;
  } | null;
  aiGeneratedProbability: number | null;
  predictedTags: { tag: string; confidence: number }[];
  flagReasons: string[];
}

type ComparisonResponse = {
  data: ComparisonData | null;
};

type ApiErrorBody = { message?: string };

function ReviewImage({ src, label }: { src: string | null; label: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-semibold">{label}</figcaption>
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt={label}
          className="h-64 w-full rounded-md border object-contain"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{src ? "Không tải được ảnh." : "Chưa có ảnh."}</p>
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

    const controller = new AbortController();
    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Axios interceptor tự gắn Authorization Bearer (access token trong memory).
        const response = await http.get<ComparisonResponse>(
          `/api/v1/submissions/${submissionId}/comparison`,
          { signal: controller.signal },
        );
        setData(response.data.data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          axios.isAxiosError<ApiErrorBody>(err)
            ? (err.response?.data?.message ?? "Không thể tải dữ liệu so sánh")
            : err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchComparisonData();
    return () => controller.abort();
  }, [isOpen, submissionId]);

  const metadata = data?.flaggedSubmission.filmMetadata;
  const filmDetails = metadata ? [
    ["Phim", [metadata.filmBrand, metadata.filmStock].filter(Boolean).join(" ")],
    ["Khổ phim", metadata.filmFormat],
    ["Máy ảnh", metadata.cameraBody],
    ["Ống kính", metadata.lens],
    ["ISO chụp", metadata.isoShot],
    ["Số frame", metadata.frameNumber],
  ].filter(([, value]) => value != null && value !== "") : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Thẩm định bài dự thi</DialogTitle>
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
              {data.flagReasons.includes("DEMO_FIXTURE") && (
                <p className="text-muted-foreground">Kết quả AI giả lập dùng cho demo.</p>
              )}
              {data.aiGeneratedProbability === null ? (
                <p className="text-muted-foreground">Chưa có kết quả phân tích AI.</p>
              ) : (
                <p>Điểm nghi vấn AI {(data.aiGeneratedProbability * 100).toFixed(1)}%</p>
              )}
              {data.duplicateCheck?.similarityScore != null && (
                <p>Độ tương đồng {(data.duplicateCheck.similarityScore * 100).toFixed(1)}%</p>
              )}
              {data.predictedTags.length > 0 && (
                <p>Thẻ gợi ý · {data.predictedTags.map(({ tag }) => tag).join(", ")}</p>
              )}
            </div>
            {filmDetails.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {filmDetails.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
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
