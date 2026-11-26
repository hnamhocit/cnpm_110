import type { SubmissionStatus } from "@/types/submission";

export const REASON_MIN = 10;
export const REASON_MAX = 1000;

export function normalizeReason(reason: string): string {
  return reason.trim();
}

export function validateReason(reason: string): string | null {
  const length = normalizeReason(reason).length;
  if (length < REASON_MIN) {
    return `Lý do phải có ít nhất ${REASON_MIN} ký tự (hiện tại ${length}).`;
  }
  if (length > REASON_MAX) {
    return `Lý do không được vượt quá ${REASON_MAX} ký tự (hiện tại ${length}).`;
  }
  return null;
}

export function toProofDeadlineIso(
  value: string,
  now: Date = new Date(),
): { iso?: string; error?: string } {
  if (!value.trim()) {
    return { error: "Vui lòng chọn hạn bổ sung bằng chứng." };
  }

  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) {
    return { error: "Hạn bổ sung bằng chứng không hợp lệ." };
  }
  if (deadline.getTime() <= now.getTime()) {
    return { error: "Hạn bổ sung bằng chứng phải sau thời điểm hiện tại." };
  }

  return { iso: deadline.toISOString() };
}

export function formatDeadlineForMessage(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function isProofSubmitted(submission: {
  status: SubmissionStatus;
  proofSubmittedAt?: string | null;
}): boolean {
  return (
    submission.status === "PROOF_SUBMITTED" ||
    Boolean(submission.proofSubmittedAt)
  );
}

export function isApprovedStatus(status: SubmissionStatus): boolean {
  return status === "APPROVED" || status === "APPROVED_FOR_JUDGING";
}

export function needsProofRequest(submission: {
  status: SubmissionStatus;
  isAiFlagged: boolean;
  proofRequestedAt?: string | null;
}): boolean {
  return (
    submission.isAiFlagged ||
    submission.status === "SUSPICIOUS" ||
    submission.status === "FLAGGED" ||
    submission.status === "PROOF_REQUESTED"
  );
}

export function getSubmissionCode(submission: {
  code?: string | null;
  submissionCode?: string | null;
  id: string;
}): string {
  return (
    submission.code?.trim() ||
    submission.submissionCode?.trim() ||
    submission.id
  );
}
