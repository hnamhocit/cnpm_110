import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { aiAnalysisJobs, contests, submissions } from "../../db/schema";
import { AppError } from "../../utils/errors";

export async function enqueueSingleAiScan(submissionId: string) {
  const [submission] = await db
    .select({ id: submissions.id, status: submissions.status })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!submission) {
    throw AppError.notFound("Submission not found");
  }

  const [job] = await db
    .insert(aiAnalysisJobs)
    .values({
      submissionId: submission.id,
      status: "PENDING",
      attempts: 0,
      lastError: null,
    })
    .onConflictDoUpdate({
      target: aiAnalysisJobs.submissionId,
      set: {
        status: "PENDING",
        attempts: 0,
        lastError: null,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: aiAnalysisJobs.id,
      submissionId: aiAnalysisJobs.submissionId,
      status: aiAnalysisJobs.status,
    });

  return job;
}

export async function enqueueBatchAiScan(
  contestId: string,
  submissionIds?: string[],
) {
  const [contest] = await db
    .select({ id: contests.id })
    .from(contests)
    .where(and(eq(contests.id, contestId), eq(contests.isDeleted, false)))
    .limit(1);

  if (!contest) {
    throw AppError.notFound("Contest not found");
  }

  const conditions = [eq(submissions.contestId, contestId)];
  if (submissionIds && submissionIds.length > 0) {
    conditions.push(inArray(submissions.id, submissionIds));
  } else {
    conditions.push(
      inArray(submissions.status, ["PENDING_AI", "SUSPICIOUS", "FLAGGED"]),
    );
  }

  const targetSubmissions = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(...conditions));

  if (targetSubmissions.length === 0) {
    return {
      contestId,
      queuedCount: 0,
      submissionIds: [] as string[],
    };
  }

  const ids = targetSubmissions.map((s) => s.id);

  await db
    .insert(aiAnalysisJobs)
    .values(
      ids.map((id) => ({
        submissionId: id,
        status: "PENDING",
        attempts: 0,
        lastError: null,
      })),
    )
    .onConflictDoUpdate({
      target: aiAnalysisJobs.submissionId,
      set: {
        status: "PENDING",
        attempts: 0,
        lastError: null,
        updatedAt: new Date(),
      },
    });

  return {
    contestId,
    queuedCount: ids.length,
    submissionIds: ids,
  };
}
