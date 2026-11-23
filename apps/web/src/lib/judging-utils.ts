import type { ScoringCriterion } from "@/types/judging";

export function calculateWeightedTotalScore(
  criteria: ScoringCriterion[],
  scores: Record<string, number>
): { totalScore: number; maxPossibleScore: number; percentage: number } {
  let weightedScoreSum = 0;
  let totalMaxWeight = 0;

  for (const criterion of criteria) {
    const rawScore = scores[criterion.id] ?? 0;
    // Điểm tính theo trọng số: rawScore * (weight / 100)
    weightedScoreSum += rawScore * (criterion.weight / 100);
    totalMaxWeight += criterion.maxScore * (criterion.weight / 100);
  }

  const percentage =
    totalMaxWeight > 0 ? (weightedScoreSum / totalMaxWeight) * 100 : 0;

  return {
    totalScore: Math.round(weightedScoreSum * 10) / 10,
    maxPossibleScore: Math.round(totalMaxWeight * 10) / 10,
    percentage: Math.round(percentage * 10) / 10,
  };
}

export function validateScorecardCompletion(
  criteria: ScoringCriterion[],
  scores: Record<string, number>,
  comments: string,
  minCommentLength = 10
): { isValid: boolean; missingCriteriaNames: string[]; commentError?: string } {
  const missingCriteriaNames: string[] = [];

  for (const criterion of criteria) {
    const score = scores[criterion.id];
    if (score === undefined || score < 0 || score > criterion.maxScore) {
      missingCriteriaNames.push(criterion.name);
    }
  }

  let commentError: string | undefined;
  if (!comments || comments.trim().length < minCommentLength) {
    commentError = `Nhận xét chuyên môn cần tối thiểu ${minCommentLength} ký tự.`;
  }

  return {
    isValid: missingCriteriaNames.length === 0 && !commentError,
    missingCriteriaNames,
    commentError,
  };
}

