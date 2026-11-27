import type {
  OfficialContestResults,
  PublishResultsInput,
  TieBreakInput,
} from "@/types/results";

export type TieGroup = {
  key: string;
  categoryId: string;
  submissionIds: string[];
  score: number;
};

export type TieDecision = {
  submissionIds: string[];
  reason: string;
};

export function round2Score(value: number): number {
  return Number(value.toFixed(2));
}

export function formatOfficialScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return round2Score(value).toFixed(2);
}

export function isOfficialResults(
  data: unknown,
): data is OfficialContestResults {
  if (!data || typeof data !== "object") return false;
  const candidate = data as {
    entries?: unknown;
    status?: unknown;
    resultsLocked?: unknown;
  };
  return (
    Array.isArray(candidate.entries) &&
    candidate.status === "RESULTS_PUBLISHED" &&
    candidate.resultsLocked === true
  );
}

export function detectTieGroups(
  entries: Array<{
    submissionId: string;
    categoryId: string;
    finalScore: number | null;
    rank?: number | null;
  }>,
): TieGroup[] {
  const groups = new Map<string, TieGroup>();

  for (const entry of entries) {
    if (entry.finalScore === null) continue;
    const score = round2Score(entry.finalScore);
    const key = `${entry.categoryId}|${score.toFixed(2)}`;
    const group = groups.get(key) ?? {
      key,
      categoryId: entry.categoryId,
      submissionIds: [],
      score,
    };
    group.submissionIds.push(entry.submissionId);
    groups.set(key, group);
  }

  return [...groups.values()]
    .filter((group) => group.submissionIds.length >= 2)
    .map((group) => ({
      ...group,
      submissionIds: [...group.submissionIds].sort((a, b) => {
        const entryA = entries.find((entry) => entry.submissionId === a);
        const entryB = entries.find((entry) => entry.submissionId === b);
        const rankA = entryA?.rank ?? Number.MAX_SAFE_INTEGER;
        const rankB = entryB?.rank ?? Number.MAX_SAFE_INTEGER;
        return rankA - rankB || a.localeCompare(b);
      }),
    }));
}

export function validateTieBreakDecisions(
  groups: TieGroup[],
  decisions: Record<string, TieDecision>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const group of groups) {
    const decision = decisions[group.key];
    if (!decision) {
      errors[group.key] = "Chưa xác nhận nhóm đồng điểm này.";
      continue;
    }

    const reason = decision.reason.trim();
    if (reason.length === 0) {
      errors[group.key] = "Cần ghi lý do xác nhận thứ hạng (BR-25).";
      continue;
    }
    if (reason.length > 1000) {
      errors[group.key] = "Lý do xác nhận không được vượt quá 1000 ký tự.";
      continue;
    }

    const ids = decision.submissionIds;
    const sameSet =
      ids.length === group.submissionIds.length &&
      new Set(ids).size === ids.length &&
      group.submissionIds.every((id) => ids.includes(id));
    if (!sameSet) {
      errors[group.key] =
        "Danh sách bài trong nhóm không khớp dữ liệu thực tế.";
    }
  }

  return errors;
}

export function buildPublishPayload(
  confirm: boolean,
  decisions: Record<string, TieDecision>,
): PublishResultsInput {
  const tieBreaks: TieBreakInput[] = [];

  for (const [key, decision] of Object.entries(decisions)) {
    if (!decision.reason.trim() || decision.submissionIds.length < 2) continue;
    const separator = key.lastIndexOf("|");
    tieBreaks.push({
      categoryId: separator >= 0 ? key.slice(0, separator) : key,
      submissionIds: [...decision.submissionIds],
      reason: decision.reason.trim(),
    });
  }

  return {
    confirm,
    ...(tieBreaks.length > 0 ? { tieBreaks } : {}),
  };
}
