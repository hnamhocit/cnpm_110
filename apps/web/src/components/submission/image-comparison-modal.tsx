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
import { getAiThresholds, unwrap } from "@/lib/ai-api";
import { buildAiWarnings, formatPercent } from "@/lib/ai-validation";
import { http } from "@/lib/http/client";
import type { AiComparisonData, AiThresholds } from "@/types/ai";

interface ImageComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | null;
}

type ComparisonResponse =
  | { data?: AiComparisonData | null }
  | AiComparisonData
  | null;

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
  const [data, setData] = useState<AiComparisonData | null>(null);
  const [thresholds, setThresholds] = useState<AiThresholds | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !submissionId) {
      setData(null);
      setThresholds(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);

      try {
        setThresholds(null);
        // Axios interceptor tự gắn Authorization Bearer (access token trong memory).
        const [response, thresholds] = await Promise.all([
          http.get<ComparisonResponse>(
            `/api/v1/submissions/${submissionId}/comparison`,
            { signal: controller.signal },
          ),
          getAiThresholds().catch(() => null),
        ]);
        if (controller.signal.aborted) return;
        setData(unwrap<AiComparisonData | null>(response.data) ?? null);
        setThresholds(thresholds ?? null);
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

  const warnings = data ? buildAiWarnings(data, thresholds || undefined) : [];
  const flagged = data?.flaggedSubmission ?? null;
  const original = data?.originalSubmission ?? null;
  const flagReasons = data?.flagReasons ?? [];
  const predictedTags = (data?.predictedTags ?? []).slice(0, 5);

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
            {warnings.length > 0 && (
              <div className="space-y-1">
                {warnings.map((warning) => (
                  <div
                    key={warning}
                    role="status"
                    className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
                  >
                    {warning}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <p className="font-medium">{flagged?.title ?? "Bài dự thi"}</p>
              {flagReasons.includes("DEMO_FIXTURE") && (
                <div
                  role="status"
                  className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-muted-foreground"
                >
                  Kết quả AI giả lập dùng cho demo.
                </div>
              )}
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Điểm nghi vấn AI</dt>
                  <dd>
                    {data.aiGeneratedProbability != null
                      ? formatPercent(data.aiGeneratedProbability)
                      : "Chưa có dữ liệu"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">pHash</dt>
                  <dd>{data.phashHex ?? "Chưa có dữ liệu"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Khoảng cách Hamming</dt>
                  <dd>
                    {data.duplicateCheck?.hammingDistance ?? "Chưa có dữ liệu"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Độ tương đồng</dt>
                  <dd>
                    {data.duplicateCheck?.similarityScore != null
                      ? formatPercent(data.duplicateCheck.similarityScore)
                      : "Chưa có dữ liệu"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Lý do gắn cờ</dt>
                  <dd>
                    {flagReasons.length > 0 ? (
                      <ul className="list-inside list-disc">
                        {flagReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    ) : (
                      "Chưa có dữ liệu"
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Thẻ gợi ý</dt>
                  <dd>
                    {predictedTags.length > 0 ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {predictedTags.map((tag) => (
                          <li
                            key={tag.tag}
                            className="rounded-full border border-border px-2 py-0.5"
                          >
                            {tag.tag}
                            {tag.confidence != null
                              ? ` · ${formatPercent(tag.confidence)}`
                              : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Chưa có thẻ gợi ý."
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ReviewImage
                src={flagged?.imagePreviewPath ?? null}
                label="Ảnh dự thi"
              />
              <ReviewImage
                src={flagged?.negativeProofPath ?? null}
                label="Âm bản hoặc contact sheet"
              />
            </div>
            {original && (
              <ReviewImage
                src={original.imagePreviewPath ?? null}
                label={`Ảnh tương tự · ${original.title ?? "bài gốc"}`}
              />
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
