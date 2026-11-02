export type SubmissionStatus =
  | "PENDING_AI"
  | "FLAGGED"
  | "APPROVED"
  | "DISQUALIFIED";

export interface Submission {
  id: string;
  authorName: string;
  title: string;
  submittedAt: string;
  isAiFlagged: boolean;
  status: SubmissionStatus;
}
