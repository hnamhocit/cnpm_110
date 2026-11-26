import { describe, expect, test } from "bun:test";
import {
  AI_FLAG_THRESHOLD_FALLBACK,
  SIMILARITY_THRESHOLD,
  buildAiWarnings,
  formatPercent,
  previewThresholdCheck,
  validateThresholdUpdate,
} from "@/lib/ai-validation";
import type { AiThresholds } from "@/types/ai";

const thresholds: AiThresholds = {
  aiGeneratedFlagThreshold: AI_FLAG_THRESHOLD_FALLBACK,
  duplicateMaxPhashDistance: 5,
};

describe("FPC-103 validateThresholdUpdate", () => {
  test("từ chối payload rỗng", () => {
    const errors = validateThresholdUpdate({});
    expect(Object.keys(errors).length).toBeGreaterThan(0);
  });

  test("từ chối xác suất âm hoặc lớn hơn 1", () => {
    expect(
      validateThresholdUpdate({ aiGeneratedFlagThreshold: -0.1 }),
    ).toHaveProperty("aiGeneratedFlagThreshold");
    expect(
      validateThresholdUpdate({ aiGeneratedFlagThreshold: 1.1 }),
    ).toHaveProperty("aiGeneratedFlagThreshold");
  });

  test("từ chối khoảng cách pHash không nguyên", () => {
    expect(
      validateThresholdUpdate({ duplicateMaxPhashDistance: 6.5 }),
    ).toHaveProperty("duplicateMaxPhashDistance");
  });

  test("chấp nhận giá trị biên", () => {
    expect(
      validateThresholdUpdate({
        aiGeneratedFlagThreshold: 0,
        duplicateMaxPhashDistance: 0,
      }),
    ).toEqual({});
    expect(
      validateThresholdUpdate({
        aiGeneratedFlagThreshold: 1,
        duplicateMaxPhashDistance: 64,
      }),
    ).toEqual({});
  });
});

describe("FPC-103 formatPercent", () => {
  test("trả về dấu gạch ngang khi thiếu dữ liệu", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
  });

  test("nhân 100 và làm tròn theo số chữ số", () => {
    expect(formatPercent(0.755)).toBe("75.5%");
    expect(formatPercent(0.755, 0)).toBe("76%");
  });
});

describe("FPC-103 buildAiWarnings", () => {
  test("không dùng số mẫu khi dữ liệu null", () => {
    expect(buildAiWarnings({})).toEqual([]);
    expect(
      buildAiWarnings({
        aiGeneratedProbability: null,
        duplicateCheck: { similarityScore: null },
      }),
    ).toEqual([]);
  });

  test("cảnh báo AI ở ngưỡng 0.75", () => {
    const warnings = buildAiWarnings({ aiGeneratedProbability: 0.75 });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Cảnh báo AI:");
    expect(warnings[0]).toContain("75%");
    expect(warnings[0]).not.toContain("%%");
  });

  test("cảnh báo trùng kèm mã bài gốc", () => {
    const warnings = buildAiWarnings({
      duplicateCheck: { similarityScore: SIMILARITY_THRESHOLD },
      originalSubmission: { id: "SUB-2026-001" },
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("92%");
    expect(warnings[0]).toContain("SUB-2026-001");
    expect(warnings[0]).not.toContain("%%");
  });
});

describe("FPC-103 previewThresholdCheck", () => {
  const input = {
    probability: AI_FLAG_THRESHOLD_FALLBACK - 0.01,
    phashDistance: 6,
    similarity: SIMILARITY_THRESHOLD - 0.01,
    targetCode: "SUB-2026-002",
    thresholds,
  };

  test("không cảnh báo khi dưới ngưỡng", () => {
    expect(previewThresholdCheck(input)).toEqual([]);
  });

  test("cảnh báo khi đúng ngưỡng", () => {
    const warnings = previewThresholdCheck({
      ...input,
      probability: AI_FLAG_THRESHOLD_FALLBACK,
      phashDistance: 5,
      similarity: SIMILARITY_THRESHOLD,
    });
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain("75%");
    expect(warnings[1]).toContain("SUB-2026-002");
    expect(warnings.join(" ")).not.toContain("48h");
  });
});
