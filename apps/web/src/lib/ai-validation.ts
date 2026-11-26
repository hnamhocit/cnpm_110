import type { AiComparisonData, AiThresholds } from "@/types/ai";

export const SIMILARITY_THRESHOLD = 0.92;
export const AI_FLAG_THRESHOLD_FALLBACK = 0.75;

const MSG016 =
  "Cảnh báo AI: Bài thi có điểm nghi vấn {ai_prob}% và cần Ban tổ chức xem xét.";
const MSG017 =
  "Cảnh báo trùng lặp: Tác phẩm có độ tương đồng {similarity}% với bài dự thi {target_code}.";

function isScore(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

export function validateThresholdUpdate(
  payload: Partial<AiThresholds>,
): Partial<Record<keyof AiThresholds, string>> {
  const errors: Partial<Record<keyof AiThresholds, string>> = {};
  const hasProbability = payload.aiGeneratedFlagThreshold !== undefined;
  const hasDistance = payload.duplicateMaxPhashDistance !== undefined;

  if (!hasProbability && !hasDistance) {
    errors.aiGeneratedFlagThreshold = "Cần cung cấp ít nhất một ngưỡng.";
    errors.duplicateMaxPhashDistance = "Cần cung cấp ít nhất một ngưỡng.";
    return errors;
  }

  if (hasProbability) {
    const value = payload.aiGeneratedFlagThreshold;
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    ) {
      errors.aiGeneratedFlagThreshold = "Ngưỡng AI phải nằm trong khoảng 0–1.";
    }
  }

  if (hasDistance) {
    const value = payload.duplicateMaxPhashDistance;
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 64
    ) {
      errors.duplicateMaxPhashDistance =
        "Khoảng cách pHash phải là số nguyên từ 0 đến 64.";
    }
  }

  return errors;
}

export function formatPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  if (!isScore(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

function percentWithoutSign(value: number, digits: number): string {
  return formatPercent(value, digits).replace(/%$/, "");
}

export function buildAiWarnings(
  data: AiComparisonData,
  thresholds?: AiThresholds,
): string[] {
  const warnings: string[] = [];
  const probability = data.aiGeneratedProbability;
  const similarity = data.duplicateCheck?.similarityScore;
  const aiFlagThreshold =
    thresholds?.aiGeneratedFlagThreshold ?? AI_FLAG_THRESHOLD_FALLBACK;

  if (isScore(probability) && probability >= aiFlagThreshold) {
    warnings.push(
      MSG016.replace("{ai_prob}", percentWithoutSign(probability, 0)),
    );
  }

  if (isScore(similarity) && similarity >= SIMILARITY_THRESHOLD) {
    const targetCode =
      data.originalSubmission?.id ??
      data.duplicateCheck?.suspectSubmissionId ??
      "—";
    warnings.push(
      MSG017.replace("{similarity}", percentWithoutSign(similarity, 0)).replace(
        "{target_code}",
        targetCode,
      ),
    );
  }

  return warnings;
}

export function previewThresholdCheck(input: {
  probability: number;
  phashDistance: number;
  similarity: number;
  targetCode: string;
  thresholds: AiThresholds;
}): string[] {
  const warnings: string[] = [];

  if (
    Number.isFinite(input.probability) &&
    input.probability >= input.thresholds.aiGeneratedFlagThreshold
  ) {
    warnings.push(
      MSG016.replace("{ai_prob}", percentWithoutSign(input.probability, 0)),
    );
  }

  if (
    Number.isFinite(input.similarity) &&
    Number.isFinite(input.phashDistance) &&
    input.similarity >= SIMILARITY_THRESHOLD &&
    input.phashDistance <= input.thresholds.duplicateMaxPhashDistance
  ) {
    warnings.push(
      MSG017.replace("{similarity}", percentWithoutSign(input.similarity, 0))
        .replace("{target_code}", input.targetCode.trim() || "—"),
    );
  }

  return warnings;
}
