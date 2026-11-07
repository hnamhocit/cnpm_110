
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
import { recoverStaleAiJobs } from "../src/services/ai-job-queue";

describe("FPC-54: AI Job Recovery DB integration", () => {
  test("Recover stale jobs and preserve completed jobs", async () => {
    const database = await pool.query(
      "SELECT current_database() AS db",
    );

    if (database.rows[0]?.db !== "fpc31_migration_test") {
      throw new Error("Test database required");
    }

    const userId = randomUUID();
    const contestId = randomUUID();
    const categoryId = randomUUID();

    const submissionIds = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ];

    const oldDate = new Date(
      Date.now() - 15 * 60 * 1000,
    );

    try {
      await db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: userId,
          fullName: "FPC54 Recovery Test",
          email: `recovery-${userId}@example.com`,
          passwordHash: "test-hash",
        });

        await tx.insert(contests).values({
          id: contestId,
          name: "FPC54 Recovery Contest",
          createdBy: userId,
        });

        await tx.insert(categories).values({
          id: categoryId,
          contestId,
          name: "FPC54 Recovery Category",
        });

        for (const submissionId of submissionIds) {
          await tx.insert(submissions).values({
            id: submissionId,
            contestId,
            categoryId,
            participantId: userId,
            title: "FPC54 Recovery Submission",
            imageOriginalPath:
              `submissions/${userId}/${submissionId}.jpg`,
            fileSizeBytes: BigInt(1024),
            width: 1000,
            height: 1000,
            status: "PENDING_AI",
          });
        }

        await tx.insert(aiAnalysisJobs).values([
          {
            submissionId: submissionIds[0]!,
            status: "PROCESSING",
            attempts: 1,
            maxAttempts: 3,
            updatedAt: oldDate,
          },
          {
            submissionId: submissionIds[1]!,
            status: "PROCESSING",
            attempts: 3,
            maxAttempts: 3,
            updatedAt: oldDate,
          },
          {
            submissionId: submissionIds[2]!,
            status: "COMPLETED",
            attempts: 1,
            maxAttempts: 3,
            updatedAt: oldDate,
          },
        ]);
      });

      await recoverStaleAiJobs(10);

      const jobs = await db
        .select()
        .from(aiAnalysisJobs);

      const findJob = (submissionId: string) =>
        jobs.find(
          (job) => job.submissionId === submissionId,
        );

      expect(findJob(submissionIds[0]!)?.status)
        .toBe("PENDING");

      expect(findJob(submissionIds[1]!)?.status)
        .toBe("FAILED");

      expect(findJob(submissionIds[2]!)?.status)
        .toBe("COMPLETED");
    } finally {
      for (const submissionId of submissionIds) {
        await db.delete(aiAnalysisJobs)
          .where(eq(aiAnalysisJobs.submissionId, submissionId));

        await db.delete(submissions)
          .where(eq(submissions.id, submissionId));
      }

      await db.delete(categories)
        .where(eq(categories.id, categoryId));

      await db.delete(contests)
        .where(eq(contests.id, contestId));

      await db.delete(users)
        .where(eq(users.id, userId));
    }
  });
});
