
export interface ScoringCriterion {
  id: string;
  maxScore: number;
  weight: number;
}

export interface CriterionScore {
  criterionId: string;
  score: number;
}

export interface JudgeScore {
  judgeId: string;
  criterionScores: CriterionScore[];
}

export interface ScoreAggregationInput {
  criteria: ScoringCriterion[];
  judges: JudgeScore[];
}

export interface ScoreAggregationResult {
  judgeTotals: {
    judgeId: string;
    totalScore: number;
  }[];
  finalScore: number;
}

const SCORE_SCALE = 100;
const WEIGHT_SCALE = 10_000;

function weightedToScore(weighted: number): number {
  return Math.round(weighted / WEIGHT_SCALE) / SCORE_SCALE;
}

export function aggregateScores(
  input: ScoreAggregationInput,
): ScoreAggregationResult {
  const { criteria, judges } = input;

  if (criteria.length === 0) {
    throw new Error("Scoring criteria must not be empty");
  }

  if (judges.length === 0) {
    throw new Error("At least one judge is required");
  }

  const criterionIds = new Set<string>();

  for (const criterion of criteria) {
    if (
      !criterion.id ||
      !Number.isFinite(criterion.maxScore) ||
      criterion.maxScore <= 0 ||
      Number(criterion.maxScore.toFixed(2)) !== criterion.maxScore ||
      !Number.isFinite(criterion.weight) ||
      criterion.weight <= 0 ||
      Number(criterion.weight.toFixed(4)) !== criterion.weight
    ) {
      throw new RangeError("Invalid scoring criterion");
    }

    if (criterionIds.has(criterion.id)) {
      throw new Error("Duplicate scoring criterion");
    }

    criterionIds.add(criterion.id);
  }

  const totalWeight = criteria.reduce(
    (sum, criterion) => sum + Math.round(criterion.weight * WEIGHT_SCALE),
    0,
  );

  if (totalWeight !== WEIGHT_SCALE) {
    throw new RangeError("Criterion weights must total 1");
  }

  const judgeIds = new Set<string>();

  const judgeTotals = judges.map((judge) => {
    if (!judge.judgeId || judgeIds.has(judge.judgeId)) {
      throw new Error("Invalid or duplicate judge");
    }

    judgeIds.add(judge.judgeId);

    if (judge.criterionScores.length !== criteria.length) {
      throw new Error("Each judge must score every criterion");
    }

    const submittedIds = new Set<string>();

    let totalScore = 0;

    for (const item of judge.criterionScores) {
      const criterion = criteria.find(
        (entry) => entry.id === item.criterionId,
      );

      if (!criterion || submittedIds.has(item.criterionId)) {
        throw new Error("Invalid or duplicate criterion score");
      }

      if (
        !Number.isFinite(item.score) ||
        item.score < 0 ||
        item.score > criterion.maxScore ||
        Number(item.score.toFixed(2)) !== item.score
      ) {
        throw new RangeError("Score is outside the allowed range");
      }

      submittedIds.add(item.criterionId);
      totalScore += Math.round(item.score * SCORE_SCALE) *
        Math.round(criterion.weight * WEIGHT_SCALE);
    }

    return {
      judgeId: judge.judgeId,
      totalScore,
    };
  });

  const totals = judgeTotals.map((judge) => judge.totalScore);

  const finalScore = weightedToScore(
    totals.reduce((sum, score) => sum + score, 0) /
      totals.length,
  );

  return {
    judgeTotals: judgeTotals.map(({ judgeId, totalScore }) => ({
      judgeId,
      totalScore: weightedToScore(totalScore),
    })),
    finalScore,
  };
}
