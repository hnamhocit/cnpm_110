
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from "bun:test";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { pool } from "../src/db";
import aiWebhook from "../src/routes/ai-webhook";
import { db } from "../src/db/index";
import {
  users,
  contests,
  categories,
  submissions,
  submissionAiAnalyses,
} from "../src/db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();
app.route("/api/v1/ai", aiWebhook);

const TEST_SECRET = "fpc52-local-integration-secret";
const originalSecret = process.env.AI_WEBHOOK_SECRET;

describe("FPC-52: AI webhook integration", () => {
  beforeAll(async () => {
    const result = await pool.query(
      "SELECT current_database() AS db"
    );

    if (result.rows[0]?.db !== "fpc31_migration_test") {
      throw new Error(
        "Integration test chỉ được chạy trên fpc31_migration_test"
      );
    }

    process.env.AI_WEBHOOK_SECRET = TEST_SECRET;
  });

  afterAll(async () => {
    if (originalSecret === undefined) {
      delete process.env.AI_WEBHOOK_SECRET;
    } else {
      process.env.AI_WEBHOOK_SECRET = originalSecret;
    }

  });

  test("Submission không tồn tại trả về 404", async () => {
    const response = await app.request(
      "/api/v1/ai/webhook",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": TEST_SECRET,
        },
        body: JSON.stringify({
          submissionId: randomUUID(),
          phashHex: "a1b2c3d4e5f67890",
          aiGeneratedProbability: 0.15,
          predictedTags: [
            { tag: "portrait", confidence: 0.95 },
          ],
        }),
      }
    );

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.message).toBe("Submission not found");
  });

  test("Lưu mới và cập nhật kết quả AI bằng webhook", async () => {
    // Kiểm tra database trước khi ghi dữ liệu.
    const result = await pool.query(
      "SELECT current_database() AS db"
    );

    if (result.rows[0]?.db !== "fpc31_migration_test") {
      throw new Error("Không được ghi vào database này");
    }

    const userId = randomUUID();
    const contestId = randomUUID();
    const categoryId = randomUUID();
    const submissionId = randomUUID();

    let userCreated = false;

    try {
      // 1. Tạo dữ liệu thử riêng
      await db.insert(users).values({
        id: userId,
        fullName: "FPC52 Integration Test",
        email: `fpc52-${userId}@example.com`,
        passwordHash: "test-only-not-a-real-password",
      });
      userCreated = true;

      await db.insert(contests).values({
        id: contestId,
        name: "FPC52 Test Contest",
        createdBy: userId,
      });

      await db.insert(categories).values({
        id: categoryId,
        contestId,
        name: "FPC52 Test Category",
      });

      await db.insert(submissions).values({
        id: submissionId,
        contestId,
        categoryId,
        participantId: userId,
        title: "FPC52 Test Submission",
        imageOriginalPath: "test/fpc52-image.jpg",
      });

      const send = (score: number, tag: string) =>
        app.request("/api/v1/ai/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": TEST_SECRET,
          },
          body: JSON.stringify({
            submissionId,
            phashHex: "a1b2c3d4e5f67890",
            aiGeneratedProbability: score,
            predictedTags: [
              { tag, confidence: 0.95 },
            ],
          }),
        });

      // 2. INSERT
      const firstResponse = await send(0.15, "portrait");
      expect(firstResponse.status).toBe(200);

      const firstRows = await db
        .select()
        .from(submissionAiAnalyses)
        .where(eq(submissionAiAnalyses.submissionId, submissionId));

      expect(firstRows).toHaveLength(1);
      expect(firstRows[0]?.aiGeneratedProbability).toBe("0.1500");
      expect(firstRows[0]?.predictedTags).toEqual([
        { tag: "portrait", confidence: 0.95 },
      ]);

      // 3. UPSERT
      const secondResponse = await send(0.85, "landscape");
      expect(secondResponse.status).toBe(200);

      const secondRows = await db
        .select()
        .from(submissionAiAnalyses)
        .where(eq(submissionAiAnalyses.submissionId, submissionId));

      expect(secondRows).toHaveLength(1);
      expect(secondRows[0]?.id).toBe(firstRows[0]?.id);
      expect(secondRows[0]?.aiGeneratedProbability).toBe("0.8500");
      expect(secondRows[0]?.predictedTags).toEqual([
        { tag: "landscape", confidence: 0.95 },
      ]);
    } finally {
      // Chỉ dọn dữ liệu do test này tạo.
      // Xóa theo thứ tự khóa ngoại.
      if (userCreated) {
        await db
          .delete(submissions)
          .where(eq(submissions.id, submissionId));

        await db
          .delete(categories)
          .where(eq(categories.id, categoryId));

        await db
          .delete(contests)
          .where(eq(contests.id, contestId));

        await db
          .delete(users)
          .where(eq(users.id, userId));
      }
    }
  });

});
