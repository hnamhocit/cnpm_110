export type MySubmissionStatus =
  | "PENDING_AI"
  | "AI_VERIFIED"
  | "AI_FLAGGED"
  | "PROOF_REQUESTED"
  | "APPROVED"
  | "JUDGING"
  | "REJECTED"
  | "DISQUALIFIED"
  | string;

export interface MySubmissionItem {
  id: string;
  contestId: string;
  contestTitle?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  title: string;
  description?: string | null;
  status: MySubmissionStatus;
  aiFlagged?: boolean;
  aiConfidence?: number | null;
  rejectionReason?: string | null;
  proofDeadline?: string | null;
  negativeProofPath?: string | null;
  imagePreviewPath?: string | null;
  imageOriginalPath?: string | null;
  createdAt: string;
  filmMetadata?: {
    cameraModel?: string | null;
    lensModel?: string | null;
    filmStock?: string | null;
    filmFormat?: string | null;
    isoRated?: number | null;
    frameNumber?: string | null;
    labName?: string | null;
  } | null;
}

export function formatRemainingTime(deadlineIso: string, nowMs: number): {
  expired: boolean;
  isUrgent: boolean;
  formatted: string;
} {
  const targetMs = new Date(deadlineIso).getTime();
  if (Number.isNaN(targetMs)) {
    return { expired: true, isUrgent: false, formatted: "00:00:00" };
  }

  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    return { expired: true, isUrgent: true, formatted: "00:00:00" };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    expired: false,
    isUrgent: hours < 6,
    formatted: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}

