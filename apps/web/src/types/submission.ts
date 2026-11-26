export type SubmissionStatus =
  | "PENDING_AI"
  | "FLAGGED"
  | "SUSPICIOUS"
  | "APPROVED"
  | "DISQUALIFIED"
  | "PROOF_REQUESTED"
  | "PROOF_SUBMITTED"
  | "WITHDRAWN"
  | "APPROVED_FOR_JUDGING"
  | "DISQUALIFIED_NO_PROOF";

export interface Submission {
  id: string;
  authorName: string;
  title: string;
  submittedAt: string;
  isAiFlagged: boolean;
  status: SubmissionStatus;
  code?: string | null;
  submissionCode?: string | null;
  proofRequestedAt?: string | null;
  proofDeadlineAt?: string | null;
  proofSubmittedAt?: string | null;
  negativeProofPath?: string | null;
  proofReviewStatus?: "PENDING" | "VALID" | "INVALID" | string | null;
  categoryRequiresProofUpfront?: boolean | null;
}
