
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { Hono } from "hono";

const originalSecret = process.env.AI_WEBHOOK_SECRET;
const testSecret = "fpc52-test-secret-not-for-production";

let app: Hono;

beforeAll(async () => {
  process.env.AI_WEBHOOK_SECRET = testSecret;

  const { default: aiWebhook } = await import(
    "../src/routes/ai-webhook"
  );

  app = new Hono();
  app.route("/api/v1/ai", aiWebhook);
});

afterAll(() => {
  if (originalSecret === undefined) {
    delete process.env.AI_WEBHOOK_SECRET;
  } else {
    process.env.AI_WEBHOOK_SECRET = originalSecret;
  }
});

async function sendWebhook(
  body: unknown,
  secret?: string
) {
  return app.request(
    "/api/v1/ai/webhook",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret
          ? { "X-Webhook-Secret": secret }
          : {}),
      },
      body: JSON.stringify(body),
    }
  );
}

describe("FPC-52: AI webhook validation", () => {
  test("Thiếu secret trả về 401", async () => {
    const response = await sendWebhook({});

    expect(response.status).toBe(401);
  });

  test("Secret không hợp lệ trả về 401", async () => {
    const response = await sendWebhook(
      {},
      "wrong-secret"
    );

    expect(response.status).toBe(401);
  });

  test("Thiếu submissionId trả về 400", async () => {
    const response = await sendWebhook(
      {},
      testSecret
    );

    expect(response.status).toBe(400);
    expect((await response.json()).message)
      .toBe("Invalid submissionId");
  });

  test("pHash không hợp lệ trả về 400", async () => {
    const response = await sendWebhook(
      {
        submissionId:
          "8661b450-a28a-469a-aeef-8147f8a2d04e",
        phashHex: "invalid",
      },
      testSecret
    );

    expect(response.status).toBe(400);
  });

  test("AI score ngoài khoảng 0-1 trả về 400", async () => {
    const response = await sendWebhook(
      {
        submissionId:
          "8661b450-a28a-469a-aeef-8147f8a2d04e",
        phashHex: "a1b2c3d4e5f67890",
        aiGeneratedProbability: 1.5,
      },
      testSecret
    );

    expect(response.status).toBe(400);
  });

  test("predictedTags không hợp lệ trả về 400", async () => {
    const response = await sendWebhook(
      {
        submissionId:
          "8661b450-a28a-469a-aeef-8147f8a2d04e",
        phashHex: "a1b2c3d4e5f67890",
        aiGeneratedProbability: 0.15,
        predictedTags: "portrait",
      },
      testSecret
    );

    expect(response.status).toBe(400);
  });
});