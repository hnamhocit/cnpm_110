export type JudgingStatus = "SCORED" | "NOT_SCORED";

/**
 * Tiến độ chấm một bài thi của một giám khảo.
 * BR-12: màn hình dành cho Organizer nên chỉ chứa mã bài + tiêu đề,
 * không chứa dữ liệu nhận dạng thí sinh.
 */
export type JudgeSubmissionProgress = {
  submissionId: string;
  submissionCode: string;
  title: string;
  categoryName: string;
  status: JudgingStatus;
  scoredAt: string | null;
};

export type JudgeProgress = {
  judgeId: string;
  fullName: string;
  email: string;
  role: string;
  categories: string[];
  submissions: JudgeSubmissionProgress[];
};

export type JudgeProgressStats = {
  assignedCount: number;
  scoredCount: number;
  notScoredCount: number;
  progressPercent: number;
};
