export type SubmissionStatus =
  | "PENDING_AI"
  | "FLAGGED"
  | "APPROVED"
  | "DISQUALIFIED";

export interface Submission {
  id: string;
  participantId: string;
  authorName: string;
  title: string;
  submittedAt: string;
  isAiFlagged: boolean;
  status: SubmissionStatus;
}

export interface SubmissionApiResponse {
  id: string;
  contestId: string;
  categoryId: string;
  participantId: string;
  title: string;
  description: string | null;
  rejectionReason: string | null;
  imageOriginalPath: string;
  imagePreviewPath: string | null;
  negativeProofPath: string | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  status: SubmissionStatus;
  aiFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}
