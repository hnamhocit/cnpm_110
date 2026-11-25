export type JudgeScore = {
  judgeId: string;
  judgeName: string;
  totalScore: number;
  submittedAt: string;
};

export type ScoreboardEntry = {
  submissionId: string;
  submissionCode: string;
  title: string;
  categoryId: string;
  categoryName: string;
  judgeCount: number;
  /** Tổng điểm tối đa của hạng mục. */
  scoreScale: number;
  proofRequired?: boolean;
  negativeProofVerified: boolean;
  scores: JudgeScore[];
};

export type ScoreboardStatus = "COMPLETE" | "JUDGING";

export type RankedScoreboardEntry = ScoreboardEntry & {
  finalScore: number | null;
  status: ScoreboardStatus;
  rank: number | null;
};

export type ScoreboardSnapshot = {
  entries: ScoreboardEntry[];
  updatedAt: string;
};

export type ScoreboardSummary = {
  total: number;
  completed: number;
  judging: number;
  missingProof: number;
};
