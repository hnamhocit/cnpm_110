export interface AiThresholds {
  aiGeneratedFlagThreshold: number;
  duplicateMaxPhashDistance: number;
}

export interface SingleAiScanResult {
  jobId: string;
  submissionId: string;
  status: string;
}

export interface BatchAiScanResult {
  contestId: string;
  queuedCount: number;
  submissionIds: string[];
}

export interface AiPredictedTag {
  tag: string;
  confidence?: number | null;
}

export interface AiDuplicateCheck {
  isSuspect?: boolean | null;
  suspectSubmissionId?: string | null;
  hammingDistance?: number | null;
  similarityScore?: number | null;
}

export interface AiSubmissionPreview {
  id?: string;
  title?: string;
  imagePreviewPath?: string | null;
  imageOriginalPath?: string | null;
  negativeProofPath?: string | null;
}

export interface AiComparisonData {
  submissionId?: string;
  status?: string;
  isAiFlagged?: boolean | null;
  aiGeneratedProbability?: number | null;
  phashHex?: string | null;
  duplicateCheck?: AiDuplicateCheck | null;
  predictedTags?: AiPredictedTag[] | null;
  flagReasons?: string[] | null;
  flaggedSubmission?: AiSubmissionPreview | null;
  originalSubmission?: AiSubmissionPreview | null;
}
