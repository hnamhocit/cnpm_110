
import { describe, expect, test } from "bun:test";
import { classifyAiDetection } from "../src/services/ai-detection";

describe("FPC-54 AI Detection", () => {
  test("Probability below 0.75 is not flagged", () => {
    const result = classifyAiDetection(0.3);

    expect(result.isAiFlagged).toBe(false);
    expect(result.riskLevel).toBe("LOW_RISK");
  });

  test("Probability exactly 0.75 is flagged", () => {
    const result = classifyAiDetection(0.75);

    expect(result.isAiFlagged).toBe(true);
    expect(result.riskLevel).toBe("HIGH_RISK");
    expect(result.flagReasons).toContain(
      "AI_FLAGGED_HIGH_RISK",
    );
  });

  test("Probability above 0.75 is flagged", () => {
    const result = classifyAiDetection(0.95);

    expect(result.isAiFlagged).toBe(true);
  });

  test("Invalid probability is rejected", () => {
    expect(() => classifyAiDetection(-0.1)).toThrow();
    expect(() => classifyAiDetection(1.2)).toThrow();
    expect(() => classifyAiDetection(NaN)).toThrow();
  });
});
