
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { pool } from "../src/db";
import { db } from "../src/db/index";
import {
  aiAnalysisJobs,
  categories,
  contests,
  submissions,
  users,
} from "../src/db/schema";
import {
  claimNextAiJob,
  failAiJob,
} from "../src/services/ai-job-queue";

describe("FPC-54: AI Job Retry integration", () => {
  test("Retry twice, then mark FAILED", async () => {
    const database = await pool.query(
      "SELECT current_database() AS db",
    );

    if (database.rows[0]?.db !== "fpc31_migration_test") {
      throw new Error("Tests require fpc31_migration_test");
    }

    // The claim function selects the oldest pending job.
    // Ensure the test database has no other pending jobs.
    const pending = await pool.query(
      "SELECT COUNT(*)::int AS count FROM ai_analysis_jobs WHERE status = 'PENDING'",
    );

    if (pending.rows[0].count !== 0) {
      throw new Error(
        "Other PENDING jobs exist. Do not run this test until the test database is isolated.",
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
          fullName: "FPC54 Retry Test",
          email: `retry-${userId}@example.com`,
          passwordHash: "test-hash",
        });

        await tx.insert(contests).values({
          id: contestId,
          name: "FPC54 Retry Contest",
          createdBy: userId,
        });

        await tx.insert(categories).values({
          id: categoryId,
          contestId,
          name: "FPC54 Retry Category",
        });

        await tx.insert(submissions).values({
          id: submissionId,
          contestId,
          categoryId,
          participantId: userId,
          title: "FPC54 Retry Submission",
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
          status: "PENDING",
          attempts: 0,
          maxAttempts: 3,
        });
      });

      for (let attempt = 1; attempt <= 3; attempt++) {
        const job = await claimNextAiJob();

        expect(job).not.toBeNull();
        expect(job?.id).toBe(jobId);
        expect(job?.attempts).toBe(attempt);

        if (!job) {
          throw new Error("Job was not claimed");
        }

        await failAiJob(
          job,
          new Error("Mock AI Model failure"),
        );

        const [updated] = await db
          .select()
          .from(aiAnalysisJobs)
          .where(eq(aiAnalysisJobs.id, jobId));

        expect(updated.attempts).toBe(attempt);
        expect(updated.status).toBe(
          attempt < 3 ? "PENDING" : "FAILED",
        );
        expect(updated.lastError).toBe(
          "Mock AI Model failure",
        );
      }

      const [finalJob] = await db
        .select()
        .from(aiAnalysisJobs)
        .where(eq(aiAnalysisJobs.id, jobId));

      expect(finalJob.status).toBe("FAILED");
      expect(finalJob.attempts).toBe(3);
    } finally {
      await db.delete(aiAnalysisJobs)
        .where(eq(aiAnalysisJobs.id, jobId));

      await db.delete(submissions)
        .where(eq(submissions.id, submissionId));

      await db.delete(categories)
        .where(eq(categories.id, categoryId));

      await db.delete(contests)
        .where(eq(contests.id, contestId));

      await db.delete(users)
        .where(eq(users.id, userId));
    }
  });
});
