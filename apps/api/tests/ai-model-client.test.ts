
import { afterEach, expect, test, mock } from "bun:test";
import { detectAiGeneratedImage } from "../src/services/ai-model-client";

const originalFetch = globalThis.fetch;
const originalUrl = process.env.AI_MODEL_URL;
const originalKey = process.env.AI_MODEL_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;

  if (originalUrl === undefined) {
    delete process.env.AI_MODEL_URL;
  } else {
    process.env.AI_MODEL_URL = originalUrl;
  }

  if (originalKey === undefined) {
    delete process.env.AI_MODEL_API_KEY;
  } else {
    process.env.AI_MODEL_API_KEY = originalKey;
  }
});

test("FPC-54: Nhận AI Confidence Score từ API", async () => {
  process.env.AI_MODEL_URL = "https://example.com/predict";

  globalThis.fetch = mock(async () =>
    new Response(
      JSON.stringify({ aiGeneratedProbability: 0.85 }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
) as unknown as typeof fetch;

  const result = await detectAiGeneratedImage(
    "https://example.com/test.jpg",
  );

  expect(result.aiGeneratedProbability).toBe(0.85);
});

test("FPC-54: Từ chối AI Score không hợp lệ", async () => {
  process.env.AI_MODEL_URL = "https://example.com/predict";

  globalThis.fetch = mock(async () =>
    new Response(
      JSON.stringify({ aiGeneratedProbability: 1.5 }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
) as unknown as typeof fetch;

  expect(
    detectAiGeneratedImage("https://example.com/test.jpg"),
  ).rejects.toThrow("Invalid AI Model response");
});

test("FPC-54: Báo lỗi khi chưa cấu hình API", async () => {
  delete process.env.AI_MODEL_URL;

  expect(
    detectAiGeneratedImage("https://example.com/test.jpg"),
  ).rejects.toThrow("AI_MODEL_URL is not configured");
});
