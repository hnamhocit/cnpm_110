import { expect, spyOn, test } from "bun:test";
import * as r2 from "../src/r2";
import { analyzeSubmissionImage } from "../src/services/ai/ai-analysis";
import * as modelClient from "../src/services/ai/ai-model-client";

test("FPC-54: Phân tích ảnh từ R2 qua AI Model", async () => {
  const signedUrl = spyOn(r2, "getR2SignedReadUrl")
    .mockResolvedValue("https://r2.example.com/test.jpg");
  const detect = spyOn(modelClient, "detectAiGeneratedImage")
    .mockResolvedValue({ aiGeneratedProbability: 0.85 });

  try {
    const result = await analyzeSubmissionImage("submissions/test.jpg");
    expect(result.aiGeneratedProbability).toBe(0.85);
    expect(signedUrl).toHaveBeenCalledWith("submissions/test.jpg", 300);
    expect(detect).toHaveBeenCalledWith("https://r2.example.com/test.jpg");
  } finally {
    signedUrl.mockRestore();
    detect.mockRestore();
  }
});
