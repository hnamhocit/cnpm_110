"use client";

import { FileClock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSubmissionApiErrorMessage,
  type ProofRequestResponse,
  requestProof,
} from "@/lib/submission-moderation-api";
import {
  formatDeadlineForMessage,
  normalizeReason,
  toProofDeadlineIso,
  validateReason,
} from "@/lib/submission-moderation-validation";

type RequestProofModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: { id: string; title: string } | null;
  onSuccess?: (result: ProofRequestResponse) => void;
};

export function RequestProofModal({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: RequestProofModalProps) {
  const [reason, setReason] = useState("");
  const [deadline, setDeadline] = useState("");
  const [proofType, setProofType] = useState<
    "negative" | "contact_sheet"
  >("negative");
  const [submitting, setSubmitting] = useState(false);

  const reasonError = validateReason(reason);
  const deadlineResult = toProofDeadlineIso(deadline);

  useEffect(() => {
    if (!open) {
      setReason("");
      setDeadline("");
      setProofType("negative");
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submission || submitting) return;

    const reasonMessage = validateReason(reason);
    const deadlineCheck = toProofDeadlineIso(deadline);
    if (reasonMessage) {
      toast.error(reasonMessage);
      return;
    }
    if (!deadlineCheck.iso) {
      toast.error(
        deadlineCheck.error ?? "Hạn bổ sung bằng chứng không hợp lệ.",
      );
      return;
    }

    const iso = deadlineCheck.iso;
    setSubmitting(true);
    try {
      const result = await requestProof(submission.id, {
        reason: normalizeReason(reason),
        proofDeadlineAt: iso,
        proofType,
      });
      toast.success(
        `Đã gửi yêu cầu bổ sung bằng chứng cho thí sinh (Hạn chót: ${formatDeadlineForMessage(result.proofDeadlineAt ?? iso)}).`,
      );
      onSuccess?.(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(getSubmissionApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileClock className="size-5" />
            Yêu cầu bổ sung bằng chứng
          </DialogTitle>
          <DialogDescription>
            Tác phẩm:{" "}
            <span className="font-semibold text-foreground">
              {submission?.title ?? "—"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proof-request-reason">
              Lý do yêu cầu đối chứng
            </Label>
            <textarea
              id="proof-request-reason"
              rows={3}
              minLength={10}
              maxLength={1000}
              required
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Nhập lý do yêu cầu bổ sung bằng chứng (10–1000 ký tự)"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {normalizeReason(reason).length}/10 ký tự tối thiểu
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof-type">Loại bằng chứng</Label>
            <select
              id="proof-type"
              value={proofType}
              onChange={(event) =>
                setProofType(
                  event.target.value as "negative" | "contact_sheet",
                )
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="negative">Âm bản</option>
              <option value="contact_sheet">Contact sheet</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof-deadline">
              Hạn bổ sung bằng chứng (do Organizer quy định)
            </Label>
            <Input
              id="proof-deadline"
              type="datetime-local"
              required
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
            {deadline && deadlineResult.error ? (
              <p className="text-xs text-red-600">{deadlineResult.error}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              BR-19 (SRS): quá hạn do Organizer xem xét thủ công, hệ thống không
              tự động loại bài.
            </p>
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
              type="submit"
              disabled={
                submitting || reasonError !== null || !deadlineResult.iso
              }
            >
              {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
