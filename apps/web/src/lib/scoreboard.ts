import type {
  RankedScoreboardEntry,
  ScoreboardEntry,
  ScoreboardStatus,
  ScoreboardSummary,
} from "@/types/scoreboard";

/** BR-14: chỉ gắn cờ khi chênh lệch LỚN HƠN 30% thang điểm. */
export const DISCREPANCY_THRESHOLD = 0.3;

export const SCOREBOARD_STATUS_LABELS: Record<ScoreboardStatus, string> = {
  COMPLETE: "Hoàn tất",
  JUDGING: "Đang chấm",
  DISCREPANCY: "Lệch điểm",
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * BR-25: điểm chung cuộc = trung bình cộng tổng điểm của TẤT CẢ giám khảo
 * được phân công. Chỉ chốt khi đủ phiếu, làm tròn 2 chữ số thập phân.
 */
export function computeFinalScore(entry: ScoreboardEntry): number | null {
  if (entry.judgeCount <= 0) return null;
  if (entry.scores.length < entry.judgeCount) return null;

  const total = entry.scores.reduce((sum, score) => sum + score.totalScore, 0);
  return round2(total / entry.scores.length);
}

/**
 * BR-14: Delta_S = S_max - S_min; gắn cờ khi Delta_S > 30% * S_scale.
 * Cần tối thiểu 2 phiếu mới so sánh được.
 */
export function isDiscrepancy(entry: ScoreboardEntry): boolean {
  if (entry.scores.length < 2 || entry.scoreScale <= 0) return false;

  const totals = entry.scores.map((score) => score.totalScore);
  const delta = Math.max(...totals) - Math.min(...totals);
  return delta > DISCREPANCY_THRESHOLD * entry.scoreScale;
}

export function getScoreboardStatus(entry: ScoreboardEntry): ScoreboardStatus {
  if (entry.judgeCount <= 0 || entry.scores.length < entry.judgeCount) {
    return "JUDGING";
  }
  return isDiscrepancy(entry) ? "DISCREPANCY" : "COMPLETE";
}

function toRankedEntry(entry: ScoreboardEntry): RankedScoreboardEntry {
  return {
    ...entry,
    finalScore: computeFinalScore(entry),
    status: getScoreboardStatus(entry),
    rank: null,
  };
}

function compareByScore(
  a: RankedScoreboardEntry,
  b: RankedScoreboardEntry,
): number {
  return (b.finalScore ?? 0) - (a.finalScore ?? 0);
}

/**
 * Xếp hạng trong từng hạng mục: chỉ bài đã đủ phiếu mới có hạng,
 * bài đang chấm xếp cuối hạng mục theo số phiếu đã nộp.
 */
export function rankScoreboard(
  entries: ScoreboardEntry[],
): RankedScoreboardEntry[] {
  const byCategory = new Map<string, RankedScoreboardEntry[]>();

  for (const entry of entries) {
    const list = byCategory.get(entry.categoryId) ?? [];
    list.push(toRankedEntry(entry));
    byCategory.set(entry.categoryId, list);
  }

  const ranked: RankedScoreboardEntry[] = [];

  for (const list of byCategory.values()) {
    const completed = list
      .filter((entry) => entry.finalScore !== null)
      .sort(compareByScore);
    const judging = list
      .filter((entry) => entry.finalScore === null)
      .sort(
        (a, b) =>
          b.scores.length - a.scores.length ||
          a.title.localeCompare(b.title, "vi"),
      );

    completed.forEach((entry, index) => {
      ranked.push({ ...entry, rank: index + 1 });
    });
    judging.forEach((entry) => {
      ranked.push(entry);
    });
  }

  return ranked.sort(
    (a, b) =>
      a.categoryName.localeCompare(b.categoryName, "vi") ||
      (a.rank ?? Number.MAX_SAFE_INTEGER) -
        (b.rank ?? Number.MAX_SAFE_INTEGER) ||
      a.title.localeCompare(b.title, "vi"),
  );
}

export function summarizeScoreboard(
  entries: ScoreboardEntry[],
): ScoreboardSummary {
  const summary: ScoreboardSummary = {
    total: entries.length,
    completed: 0,
    judging: 0,
    discrepancy: 0,
    missingProof: 0,
  };

  for (const entry of entries) {
    const status = getScoreboardStatus(entry);
    if (status === "COMPLETE") summary.completed += 1;
    if (status === "JUDGING") summary.judging += 1;
    if (status === "DISCREPANCY") summary.discrepancy += 1;
    if (!entry.negativeProofVerified) summary.missingProof += 1;
  }

  return summary;
}

export type ScoreboardFilters = {
  query?: string;
  categoryId?: string;
  status?: "ALL" | ScoreboardStatus;
};

export function filterScoreboard(
  entries: RankedScoreboardEntry[],
  filters: ScoreboardFilters = {},
): RankedScoreboardEntry[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  const categoryId = filters.categoryId ?? "ALL";
  const status = filters.status ?? "ALL";

  return entries.filter((entry) => {
    const matchesQuery =
      query.length === 0 ||
      entry.title.toLowerCase().includes(query) ||
      entry.submissionCode.toLowerCase().includes(query);

    const matchesCategory =
      categoryId === "ALL" || entry.categoryId === categoryId;

    const matchesStatus = status === "ALL" || entry.status === status;

    return matchesQuery && matchesCategory && matchesStatus;
  });
}

export function formatScore(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
