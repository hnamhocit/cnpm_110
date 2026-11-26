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
  aiAnalysis?: {
    aiGeneratedProbability?: number | null;
    phashHex?: string | null;
    duplicateSuspectId?: string | null;
    duplicateSimilarityScore?: number | null;
    predictedTags?: { tag: string; confidence?: number | null }[] | null;
    flagReasons?: string[] | null;
  } | null;
}
