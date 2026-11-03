
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import {
  aiAnalysisJobs,
  submissionAiAnalyses,
  submissions,
} from "../db/schema";
import { analyzeSubmissionImage } from "./ai-analysis";
import { classifyAiDetection } from "./ai-detection";
import type { ClaimedAiJob } from "./ai-job-queue";

export async function processAiJob(
  job: ClaimedAiJob,
): Promise<void> {
  // 1. Get submission image path.
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, job.submissionId))
    .limit(1);

  if (!submission) {
    throw new Error("Submission not found");
  }

  // 2. Request an AI confidence score.
  const result = await analyzeSubmissionImage(
    submission.imageOriginalPath,
  );

  // 3. Classify the AI detection result.
  const detection = classifyAiDetection(
    result.aiGeneratedProbability,
  );

  // 4. Save the result and complete the job atomically.
  await db.transaction(async (tx) => {
    await tx
      .insert(submissionAiAnalyses)
      .values({
        submissionId: job.submissionId,
        aiGeneratedProbability:
          result.aiGeneratedProbability.toFixed(4),
        isAiFlagged: detection.isAiFlagged,
        flagReasons: detection.flagReasons,
      })
      .onConflictDoUpdate({
        target: submissionAiAnalyses.submissionId,
        set: {
          aiGeneratedProbability:
            result.aiGeneratedProbability.toFixed(4),
          isAiFlagged: detection.isAiFlagged,
          flagReasons: detection.flagReasons,
        },
      });

    // Only automatically flag submissions awaiting AI review.
    if (detection.isAiFlagged) {
      const [current] = await tx
        .select({ status: submissions.status })
        .from(submissions)
        .where(eq(submissions.id, job.submissionId))
        .limit(1);

      if (current?.status === "PENDING_AI") {
        await tx
          .update(submissions)
          .set({ status: "FLAGGED" })
          .where(eq(submissions.id, job.submissionId));
      }
    }

    await tx
      .update(aiAnalysisJobs)
      .set({
        status: "COMPLETED",
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(aiAnalysisJobs.id, job.id));
  });
}
