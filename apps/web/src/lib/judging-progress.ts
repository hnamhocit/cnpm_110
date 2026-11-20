import type {
  JudgeProgress,
  JudgeProgressStats,
  JudgeSubmissionProgress,
  JudgingStatus,
} from "@/types/judging";

export type JudgingState = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
export type JudgingStateFilter = "ALL" | JudgingState;

export const JUDGING_STATE_LABELS: Record<JudgingStateFilter, string> = {
  ALL: "Tất cả",
  COMPLETED: "Hoàn thành",
  IN_PROGRESS: "Đang chấm",
  NOT_STARTED: "Chưa bắt đầu",
};

export function calculateProgressPercent(
  scoredCount: number,
  assignedCount: number,
): number {
  if (assignedCount <= 0) return 0;
  return Math.round((scoredCount / assignedCount) * 100);
}

export function getJudgeStats(judge: JudgeProgress): JudgeProgressStats {
  const assignedCount = judge.submissions.length;
  const scoredCount = judge.submissions.filter(
    (submission) => submission.status === "SCORED",
  ).length;

  return {
    assignedCount,
    scoredCount,
    notScoredCount: assignedCount - scoredCount,
    progressPercent: calculateProgressPercent(scoredCount, assignedCount),
  };
}

export function summarizeJudgeProgress(
  judges: JudgeProgress[],
): JudgeProgressStats {
  let assignedCount = 0;
  let scoredCount = 0;

  for (const judge of judges) {
    const stats = getJudgeStats(judge);
    assignedCount += stats.assignedCount;
    scoredCount += stats.scoredCount;
  }

  return {
    assignedCount,
    scoredCount,
    notScoredCount: assignedCount - scoredCount,
    progressPercent: calculateProgressPercent(scoredCount, assignedCount),
  };
}

export function getJudgingState(stats: JudgeProgressStats): JudgingState {
  if (stats.assignedCount > 0 && stats.scoredCount === stats.assignedCount) {
    return "COMPLETED";
  }
  if (stats.scoredCount > 0) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export type JudgeProgressFilters = {
  query?: string;
  category?: string;
  state?: JudgingStateFilter;
};

export function filterJudges(
  judges: JudgeProgress[],
  filters: JudgeProgressFilters = {},
): JudgeProgress[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  const category = filters.category ?? "ALL";
  const state = filters.state ?? "ALL";

  return judges.filter((judge) => {
    const matchesQuery =
      query.length === 0 ||
      judge.fullName.toLowerCase().includes(query) ||
      judge.email.toLowerCase().includes(query) ||
      judge.categories.some((item) => item.toLowerCase().includes(query));

    const matchesCategory =
      category === "ALL" || judge.categories.includes(category);

    const matchesState =
      state === "ALL" || getJudgingState(getJudgeStats(judge)) === state;

    return matchesQuery && matchesCategory && matchesState;
  });
}

export type JudgeSubmissionFilters = {
  query?: string;
  status?: "ALL" | JudgingStatus;
};

export function filterJudgeSubmissions(
  submissions: JudgeSubmissionProgress[],
  filters: JudgeSubmissionFilters = {},
): JudgeSubmissionProgress[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  const status = filters.status ?? "ALL";

  return submissions.filter((submission) => {
    const matchesQuery =
      query.length === 0 ||
      submission.title.toLowerCase().includes(query) ||
      submission.submissionCode.toLowerCase().includes(query);

    const matchesStatus = status === "ALL" || submission.status === status;

    return matchesQuery && matchesStatus;
  });
}
