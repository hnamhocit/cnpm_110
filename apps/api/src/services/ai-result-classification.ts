
import { AI_HIGH_RISK_THRESHOLD } from "./ai-detection";

export type VerificationStatus =
  | "VERIFIED"
  | "SUSPICIOUS"
  | "FLAGGED";

export interface ClassificationInput {
  aiGeneratedProbability: number;
  duplicateSuspectId?: string | null;
}

export interface ClassificationResult {
  status: VerificationStatus;
  reasons: string[];
}

// Ngưỡng tạm đề xuất, cần nhóm trưởng xác nhận.
export const AI_SUSPICIOUS_THRESHOLD = 0.5;

export function classifyAiResult(
  input: ClassificationInput,
): ClassificationResult {
  const { aiGeneratedProbability, duplicateSuspectId } = input;

  if (
    !Number.isFinite(aiGeneratedProbability) ||
    aiGeneratedProbability < 0 ||
    aiGeneratedProbability > 1
  ) {
    throw new RangeError(
      "AI probability must be between 0 and 1",
    );
  }

  if (aiGeneratedProbability >= AI_HIGH_RISK_THRESHOLD) {
    return {
      status: "FLAGGED",
      reasons: ["AI_FLAGGED_HIGH_RISK"],
    };
  }

  const reasons: string[] = [];

  if (aiGeneratedProbability >= AI_SUSPICIOUS_THRESHOLD) {
    reasons.push("AI_SUSPICIOUS");
  }

  if (duplicateSuspectId) {
    reasons.push("DUPLICATE_SUSPECTED");
  }

  if (reasons.length > 0) {
    return {
      status: "SUSPICIOUS",
      reasons,
    };
  }

  return {
    status: "VERIFIED",
    reasons: [],
  };
}
