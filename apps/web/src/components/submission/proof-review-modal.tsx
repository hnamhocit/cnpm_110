"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http/client";
import {
  getSubmissionApiErrorMessage,
  moderateSubmission,
  verifyProof,
} from "@/lib/submission-moderation-api";
import {
  getSubmissionCode,
  normalizeReason,
  validateReason,
} from "@/lib/submission-moderation-validation";
import type { Submission, SubmissionStatus } from "@/types/submission";

type ProofReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  onApproved?: (id: string, status: SubmissionStatus) => void;
};

type ComparisonData = {
  flaggedSubmission?: {
    imagePreviewPath?: string | null;
    negativeProofPath?: string | null;
  } | null;
  aiGeneratedProbability?: number | null;
  flagReasons?: string[] | null;
};

type ComparisonResponse = { data?: ComparisonData | null };

function ReviewImage({ src, label }: { src: string | null; label: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-semibold">{label}</figcaption>
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt={label}
          className="h-56 w-full rounded-md border object-contain"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {src ? "Không tải được ảnh." : "Chưa có ảnh."}
        </p>
      )}
    </figure>
  );
}

export function ProofReviewModal({
  open,
  onOpenChange,
  submission,
  onApproved,
}: ProofReviewModalProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionId = submission?.id;

  useEffect(() => {
    setVerified(false);
    setReason("");
    setSubmitting(false);
  }, [open, submissionId]);

  useEffect(() => {
    if (!open || !submissionId) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const fetchComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await http.get<ComparisonData | ComparisonResponse>(
          `/api/v1/submissions/${submissionId}/comparison`,
          { signal: controller.signal },
        );
        const body = response.data;
        const nextData =
          body && "data" in body ? body.data : (body as ComparisonData | null);
        setData(nextData ?? null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(getSubmissionApiErrorMessage(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchComparison();
    return () => controller.abort();
  }, [open, submissionId]);

  const reasonError = validateReason(reason);
  const hasProofImage = Boolean(data?.flaggedSubmission?.negativeProofPath);

  async function handleApprove() {
    if (!submission || !verified || reasonError || submitting) return;

    const id = submission.id;
    setSubmitting(true);
    try {
      await verifyProof(id);
      await moderateSubmission(
        id,
        "APPROVE_FOR_JUDGING",
        normalizeReason(reason),
      );
      toast.success(
        `Đã phê duyệt tác phẩm ${getSubmissionCode(submission)} vào danh sách chấm thi chính thức.`,
      );
      onApproved?.(id, "APPROVED_FOR_JUDGING");
      onOpenChange(false);
    } catch (err) {
      toast.error(getSubmissionApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Xác minh bằng chứng &amp; duyệt bài
          </DialogTitle>
          <DialogDescription>
            Đối chiếu ảnh dự thi với âm bản/contact sheet trước khi đưa vào danh
            sách chấm thi chính thức (BR-06).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {!loading && !error && data ? (
          <>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{submission?.title}</p>
              {data.aiGeneratedProbability != null ? (
                <p>
                  Điểm nghi vấn AI{" "}
                  {(data.aiGeneratedProbability * 100).toFixed(1)}%
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Chưa có kết quả phân tích AI.
                </p>
              )}
              {data.flagReasons && data.flagReasons.length > 0 ? (
                <ul className="list-disc pl-5 text-muted-foreground">
                  {data.flagReasons.map((flagReason) => (
                    <li key={flagReason}>{flagReason}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ReviewImage
                src={data.flaggedSubmission?.imagePreviewPath ?? null}
                label="Ảnh dự thi"
              />
              <ReviewImage
                src={data.flaggedSubmission?.negativeProofPath ?? null}
                label="Âm bản / contact sheet"
              />
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="proof-verified"
              checked={verified}
              onCheckedChange={(checked) => setVerified(checked === true)}
            />
            <Label htmlFor="proof-verified" className="leading-relaxed">
              Tôi đã đối chiếu ảnh và xác minh bằng chứng hợp lệ (BR-06)
            </Label>
          </div>

          {data && !hasProofImage ? (
            <p className="text-xs text-amber-600">
              Chưa có ảnh âm bản/contact sheet để đối chiếu — không thể xác minh
              (BR-06).
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="proof-review-reason">
              Lý do xác minh / gỡ cờ <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="proof-review-reason"
              rows={3}
              minLength={10}
              maxLength={1000}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Nhập lý do xác minh (10–1000 ký tự)"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              BR-18 · {normalizeReason(reason).length}/10 ký tự tối thiểu
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={
              !data || !hasProofImage || !verified || reasonError !== null || submitting
            }
            onClick={() => void handleApprove()}
          >
            {submitting ? "Đang xác minh..." : "Xác minh & phê duyệt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
