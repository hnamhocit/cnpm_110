export type SubmissionStatus =
  | "PENDING_AI"
  | "FLAGGED"
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
}
