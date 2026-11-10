
export const AI_HIGH_RISK_THRESHOLD = 0.75;

export type AiRiskLevel = "LOW_RISK" | "HIGH_RISK";

export interface AiDetectionResult {
  aiGeneratedProbability: number;
  isAiFlagged: boolean;
  riskLevel: AiRiskLevel;
  flagReasons: string[];
}

export function classifyAiDetection(
  probability: number,
): AiDetectionResult {
  if (
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1
  ) {
    throw new RangeError(
      "AI probability must be between 0 and 1",
    );
  }

  const isAiFlagged =
    probability >= AI_HIGH_RISK_THRESHOLD;

  return {
    aiGeneratedProbability: probability,
    isAiFlagged,
    riskLevel: isAiFlagged
      ? "HIGH_RISK"
      : "LOW_RISK",
    flagReasons: isAiFlagged
      ? ["AI_FLAGGED_HIGH_RISK"]
      : [],
  };
}
