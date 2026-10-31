
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { pool } from "../src/db";
import { db } from "../src/db/index";
import aiWebhook from "../src/routes/ai-webhook";
import {
    users,
    contests,
    categories,
    submissions,
    submissionAiAnalyses,
} from "../src/db/schema";

const app = new Hono();
app.route("/api/v1/ai", aiWebhook);

const TEST_SECRET = "fpc53-local-integration-secret";
const originalSecret = process.env.AI_WEBHOOK_SECRET;

describe("FPC-53: Duplicate detection integration", () => {
    beforeAll(async () => {
        const result = await pool.query(
            "SELECT current_database() AS db",
        );

        if (result.rows[0]?.db !== "fpc31_migration_test") {
            throw new Error(
                "FPC-53 integration test chi duoc chay tren fpc31_migration_test",
            );
        }

        process.env.AI_WEBHOOK_SECRET = TEST_SECRET;
    });

    afterAll(() => {
        if (originalSecret === undefined) {
            delete process.env.AI_WEBHOOK_SECRET;
        } else {
            process.env.AI_WEBHOOK_SECRET = originalSecret;
        }
    });

    test("Phat hien anh trung va cap nhat khi pHash thay doi", async () => {
        const userId = randomUUID();
        const contestId = randomUUID();
        const categoryId = randomUUID();
        const firstId = randomUUID();
        const secondId = randomUUID();

        let userCreated = false;

        const sendWebhook = (submissionId: string, phashHex: string) =>
            app.request("/api/v1/ai/webhook", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-Secret": TEST_SECRET,
                },
                body: JSON.stringify({
                    submissionId,
                    phashHex,
                    aiGeneratedProbability: 0.15,
                    predictedTags: [],
                }),
            });

        try {
            await db.insert(users).values({
                id: userId,
                fullName: "FPC53 Integration Test",
                email: `fpc53-${userId}@example.com`,
                passwordHash: "test-only-not-a-real-password",
            });
            userCreated = true;

            await db.insert(contests).values({
                id: contestId,
                name: "FPC53 Test Contest",
                createdBy: userId,
            });

            await db.insert(categories).values({
                id: categoryId,
                contestId,
                name: "FPC53 Test Category",
            });

            await db.insert(submissions).values([
                {
                    id: firstId,
                    contestId,
                    categoryId,
                    participantId: userId,
                    title: "First Test Image",
                    imageOriginalPath: "test/fpc53-first.jpg",
                },
                {
                    id: secondId,
                    contestId,
                    categoryId,
                    participantId: userId,
                    title: "Second Test Image",
                    imageOriginalPath: "test/fpc53-second.jpg",
                },
            ]);

            // Anh dau tien chua co anh nao de so sanh.
            const firstResponse = await sendWebhook(
                firstId,
                "0000000000000000",
            );
            expect(firstResponse.status).toBe(200);

            // Anh thu hai co pHash giong het anh dau tien.
            const secondResponse = await sendWebhook(
                secondId,
                "0000000000000000",
            );
            expect(secondResponse.status).toBe(200);

            const [duplicateRow] = await db
                .select()
                .from(submissionAiAnalyses)
                .where(eq(submissionAiAnalyses.submissionId, secondId));

            expect(duplicateRow?.duplicateSuspectId).toBe(firstId);
            expect(duplicateRow?.duplicateSimilarityScore).toBe("1.0000");

            // Cap nhat anh thu hai thanh hash khac hoan toan.
            const updateResponse = await sendWebhook(
                secondId,
                "ffffffffffffffff",
            );
            expect(updateResponse.status).toBe(200);

            const [updatedRow] = await db
                .select()
                .from(submissionAiAnalyses)
                .where(eq(submissionAiAnalyses.submissionId, secondId));

       
            expect(updatedRow?.duplicateSuspectId).toBeNull();
            expect(updatedRow?.duplicateSimilarityScore).toBeNull();
            expect(updatedRow?.aiGeneratedProbability).toBe("0.1500");

            // FPC-53: Kiem tra nguong Hamming = 5
            const thresholdResponse = await sendWebhook(
                secondId,
                "000000000000001f",
            );

            expect(thresholdResponse.status).toBe(200);

            const [thresholdRow] = await db
                .select()
                .from(submissionAiAnalyses)
                .where(eq(submissionAiAnalyses.submissionId, secondId));

            expect(thresholdRow?.duplicateSuspectId).toBe(firstId);
            expect(thresholdRow?.duplicateSimilarityScore).toBe("0.9219");

        } finally {
            if (userCreated) {
                // Xoa du lieu AI do test tao ra
                await db
                    .delete(submissionAiAnalyses)
                    .where(
                        inArray(submissionAiAnalyses.submissionId, [
                            firstId,
                            secondId,
                        ]),
                    );

                await db
                    .delete(submissions)
                    .where(inArray(submissions.id, [firstId, secondId]));

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
