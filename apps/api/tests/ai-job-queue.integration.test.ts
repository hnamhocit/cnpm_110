
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { pool } from "../src/db";
import { db } from "../src/db/index";
import { claimNextAiJob } from "../src/services/ai-job-queue";
import {
  aiAnalysisJobs,
  categories,
  contests,
  submissions,
  users,
} from "../src/db/schema";

describe("FPC-54: AI Job Queue integration", () => {
  test("Nhận Job PENDING và chuyển sang PROCESSING", async () => {
    const result = await pool.query(
      "SELECT current_database() AS db",
    );

    if (result.rows[0]?.db !== "fpc31_migration_test") {
      throw new Error("Tests require fpc31_migration_test");
    }

    const userId = randomUUID();
    const contestId = randomUUID();
    const categoryId = randomUUID();
    const submissionId = randomUUID();

    try {
      await db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: userId,
          fullName: "FPC54 Queue Test",
          email: `queue-${userId}@example.com`,
          passwordHash: "test-hash",
        });

        await tx.insert(contests).values({
          id: contestId,
          name: "FPC54 Queue Contest",
          createdBy: userId,
        });

        await tx.insert(categories).values({
          id: categoryId,
          contestId,
          name: "FPC54 Queue Category",
        });

        await tx.insert(submissions).values({
          id: submissionId,
          contestId,
          categoryId,
          participantId: userId,
          title: "FPC54 Queue Submission",
          imageOriginalPath: `submissions/${userId}/test.jpg`,
          fileSizeBytes: BigInt(1024),
          width: 1000,
          height: 1000,
          status: "PENDING_AI",
        });

        await tx.insert(aiAnalysisJobs).values({
          submissionId,
          status: "PENDING",
          attempts: 0,
          maxAttempts: 3,
        });
      });

      const claimed = await claimNextAiJob();

      expect(claimed).not.toBeNull();
      expect(claimed?.submissionId).toBe(submissionId);
      expect(claimed?.attempts).toBe(1);

      const [job] = await db
        .select()
        .from(aiAnalysisJobs)
        .where(eq(aiAnalysisJobs.submissionId, submissionId));

      expect(job?.status).toBe("PROCESSING");
      expect(job?.attempts).toBe(1);
    } finally {
      await db.delete(aiAnalysisJobs)
        .where(eq(aiAnalysisJobs.submissionId, submissionId));

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
