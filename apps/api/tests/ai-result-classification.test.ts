
import { describe, expect, test } from "bun:test";
import { classifyAiResult } from "../src/services/ai-result-classification";

describe("FPC-55 AI result classification", () => {
  test("Low AI probability returns VERIFIED", () => {
    const result = classifyAiResult({
      aiGeneratedProbability: 0.2,
    });

    expect(result.status).toBe("VERIFIED");
  });

  test("Medium AI probability returns SUSPICIOUS", () => {
    const result = classifyAiResult({
      aiGeneratedProbability: 0.6,
    });

    expect(result.status).toBe("SUSPICIOUS");
  });

  test("High AI probability returns FLAGGED", () => {
    const result = classifyAiResult({
      aiGeneratedProbability: 0.85,
    });

    expect(result.status).toBe("FLAGGED");
  });

  test("Duplicate suspect returns SUSPICIOUS", () => {
    const result = classifyAiResult({
      aiGeneratedProbability: 0.2,
      duplicateSuspectId: "duplicate-id",
    });

    expect(result.status).toBe("SUSPICIOUS");
  });

  test("Exactly 0.75 returns FLAGGED", () => {
    const result = classifyAiResult({
      aiGeneratedProbability: 0.75,
    });

    expect(result.status).toBe("FLAGGED");
  });

  test("Invalid probability is rejected", () => {
    expect(() =>
      classifyAiResult({
        aiGeneratedProbability: 1.5,
      }),
    ).toThrow(RangeError);
  });
});
