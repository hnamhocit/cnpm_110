export type ScoreboardApiEntry = {
  submissionId: string;
  submissionCode?: string;
  title: string;
  categoryId: string;
  categoryName: string;
  judgeCount: number;
  scoreScale: number;
  negativeProofVerified: boolean;
  finalScore: number | null;
  rank: number | null;
  discrepancyFlag?: string | null;
  scores: {
    judgeId: string;
    judgeName: string;
    totalScore: number;
    submittedAt: string;
  }[];
};

export type ScoreboardApiResponse = {
  data: {
    entries: ScoreboardApiEntry[];
    updatedAt: string;
  };
};

export type TieBreakInput = {
  categoryId: string;
  submissionIds: string[];
  reason: string;
};

export type PublishResultsInput = {
  confirm: boolean;
  tieBreaks?: TieBreakInput[];
};

export type PublishResultsResponse = {
  data: {
    contestId: string;
    contestName?: string;
    roundId: string;
    publishedAt: string;
    status: "RESULTS_PUBLISHED";
    resultsLocked: true;
    entries: OfficialResultEntry[];
    winners: OfficialResultEntry[];
  };
};

export type OfficialResultEntry = {
  submissionId: string;
  categoryId: string;
  categoryName: string;
  rank: number;
  finalScore: number;
  award: string | null;
  awardRank: number | null;
  awardTitle: string | null;
  prizeValueVnd: number | null;
  title: string;
  authorName: string;
  photoUrl: string | null;
  isProofVerified: boolean;
  isResultsLocked: boolean;
  submissionCode?: string;
};

export type OfficialContestResults = {
  contestId: string;
  contestName?: string;
  roundId: string;
  publishedAt: string;
  status: "RESULTS_PUBLISHED";
  resultsLocked: true;
  entries: OfficialResultEntry[];
  winners: OfficialResultEntry[];
  tieBreaks?: TieBreakInput[];
};

export type LegacyResultWinner = {
  submissionId?: string;
  submissionCode?: string;
  title?: string;
  authorName?: string;
  categoryId?: string;
  categoryName?: string;
  rank?: number | null;
  finalScore?: number | null;
  award?: string | null;
  awardTitle?: string | null;
  prizeValueVnd?: number | null;
  photoUrl?: string | null;
  isProofVerified?: boolean;
};

export type LegacyContestResults = {
  winners: LegacyResultWinner[];
};

export type ContestResults = OfficialContestResults | LegacyContestResults;

export type SubmissionCriterionScore = {
  criterionId: string;
  criterionName?: string;
  score: number;
  maxScore?: number;
  weight?: number;
};

export type SubmissionFeedbackItem = {
  evaluationId: string;
  judgeId: string;
  judgeName: string;
  comment: string | null;
  evaluatedAt: string;
  weightedSum: number;
  totalScore: number;
  criterionScores: SubmissionCriterionScore[];
};

export type OfficialSubmissionResult = {
  rank: number;
  finalScore: number;
  finalScoreFormatted: string;
  award: string | null;
  awardRank: number | null;
  awardTitle: string | null;
  prizeValueVnd: number | null;
  isProofVerified: boolean;
  isResultsLocked: boolean;
};

export type SubmissionFeedbackResponse = {
  data: {
    submissionId: string;
    contestId: string;
    contestName: string;
    categoryId: string;
    categoryName: string;
    title: string;
    roundId: string;
    publishedAt: string;
    status: string;
    resultsLocked: boolean;
    result: OfficialSubmissionResult | null;
    feedback: SubmissionFeedbackItem[];
  };
};

export type MyContestResultsResponse = {
  data: {
    contestId: string;
    contestName?: string;
    roundId: string;
    publishedAt: string;
    status: string;
    resultsLocked: boolean;
    submissions: {
      submissionId: string;
      categoryId: string;
      categoryName: string;
      title: string;
      submissionStatus?: string;
      result: OfficialSubmissionResult | null;
      feedback: SubmissionFeedbackItem[];
    }[];
  };
};
