
import { afterEach, expect, mock, test } from "bun:test";

const signedUrlMock = mock(async (_key: string, _expires: number) =>
  "https://r2.example.com/test.jpg",
);

const detectMock = mock(async (_url: string) => ({
  aiGeneratedProbability: 0.85,
}));

mock.module("../src/r2", () => ({
  getR2SignedReadUrl: signedUrlMock,
}));

mock.module("../src/services/ai-model-client", () => ({
  detectAiGeneratedImage: detectMock,
}));

const { analyzeSubmissionImage } = await import(
  "../src/services/ai-analysis"
);

afterEach(() => {
  signedUrlMock.mockClear();
  detectMock.mockClear();
});

test("FPC-54: Phân tích ảnh từ R2 qua AI Model", async () => {
  const result = await analyzeSubmissionImage(
    "submissions/test.jpg",
  );

  expect(result.aiGeneratedProbability).toBe(0.85);

  expect(signedUrlMock).toHaveBeenCalledWith(
    "submissions/test.jpg",
    300,
  );

  expect(detectMock).toHaveBeenCalledWith(
    "https://r2.example.com/test.jpg",
  );
});
