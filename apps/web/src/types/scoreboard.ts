export type JudgeScore = {
  judgeId: string;
  judgeName: string;
  totalScore: number;
  submittedAt: string;
};

export type ScoreboardEntry = {
  contestId: string;
  submissionId: string;
  submissionCode: string;
  title: string;
  categoryId: string;
  categoryName: string;
  judgeCount: number;
  /** Tổng điểm tối đa của hạng mục (tổng maxScore các tiêu chí) — dùng cho BR-14. */
  scoreScale: number;
  negativeProofVerified: boolean;
  scores: JudgeScore[];
};

export type ScoreboardStatus = "COMPLETE" | "JUDGING" | "DISCREPANCY";

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
  discrepancy: number;
  missingProof: number;
};
