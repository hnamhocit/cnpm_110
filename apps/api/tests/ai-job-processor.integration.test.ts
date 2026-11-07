
import { describe, expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { pool } from "../src/db";
import { db } from "../src/db/index";
import {
  aiAnalysisJobs,
  categories,
  contests,
  submissionAiAnalyses,
  submissions,
  users,
} from "../src/db/schema";

// Mock AI analysis to avoid real R2/API requests.
const analyzeMock = mock(
  async (_imagePath: string) => ({
    aiGeneratedProbability: 0.85,
  }),
);

mock.module("../src/services/ai-analysis", () => ({
  analyzeSubmissionImage: analyzeMock,
}));

const { processAiJob } = await import(
  "../src/services/ai-job-processor"
);

describe("FPC-54: AI Job Processor integration", () => {
  test("Save AI score and complete job", async () => {
    // Safety: use only the dedicated test database.
    const result = await pool.query(
      "SELECT current_database() AS db",
    );

    if (result.rows[0]?.db !== "fpc31_migration_test") {
      throw new Error(
        "Tests require fpc31_migration_test",
      );
    }

    const userId = randomUUID();
    const contestId = randomUUID();
    const categoryId = randomUUID();
    const submissionId = randomUUID();
    const jobId = randomUUID();

    try {
      await db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: userId,
          fullName: "FPC54 Processor Test",
          email: `processor-${userId}@example.com`,
          passwordHash: "test-hash",
        });

        await tx.insert(contests).values({
          id: contestId,
          name: "FPC54 Processor Contest",
          createdBy: userId,
        });

        await tx.insert(categories).values({
          id: categoryId,
          contestId,
          name: "FPC54 Processor Category",
        });

        await tx.insert(submissions).values({
          id: submissionId,
          contestId,
          categoryId,
          participantId: userId,
          title: "FPC54 Processor Submission",
          imageOriginalPath:
            `submissions/${userId}/test.jpg`,
          fileSizeBytes: BigInt(1024),
          width: 1000,
          height: 1000,
          status: "PENDING_AI",
        });

        await tx.insert(aiAnalysisJobs).values({
          id: jobId,
          submissionId,
          status: "PROCESSING",
          attempts: 1,
          maxAttempts: 3,
        });
      });

      await processAiJob({
        id: jobId,
        submissionId,
        attempts: 1,
        maxAttempts: 3,
      });

      const [analysis] = await db
        .select()
        .from(submissionAiAnalyses)
        .where(
          eq(submissionAiAnalyses.submissionId, submissionId),
        );

      const [job] = await db
        .select()
        .from(aiAnalysisJobs)
        .where(eq(aiAnalysisJobs.id, jobId));

      const [submission] = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, submissionId));

      expect(analysis).toBeDefined();
      expect(Number(analysis?.aiGeneratedProbability))
        .toBe(0.85);
      expect(analysis?.isAiFlagged).toBe(true);
      expect(analysis?.flagReasons)
        .toContain("AI_FLAGGED_HIGH_RISK");

      expect(job?.status).toBe("COMPLETED");
      expect(submission?.status).toBe("FLAGGED");

      expect(analyzeMock).toHaveBeenCalledWith(
        `submissions/${userId}/test.jpg`,
      );
    } finally {
      await db.delete(aiAnalysisJobs)
        .where(eq(aiAnalysisJobs.id, jobId));

      await db.delete(submissionAiAnalyses)
        .where(
          eq(submissionAiAnalyses.submissionId, submissionId),
        );

      await db.delete(submissions)
        .where(eq(submissions.id, submissionId));

      await db.delete(categories)
        .where(eq(categories.id, categoryId));

      await db.delete(contests)
        .where(eq(contests.id, contestId));

      await db.delete(users)
        .where(eq(users.id, userId));

      analyzeMock.mockClear();
    }
  });
});
