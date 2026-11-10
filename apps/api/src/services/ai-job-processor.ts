
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/index";
import {
  aiAnalysisJobs,
  submissionAiAnalyses,
  submissions,
} from "../db/schema";
import { analyzeSubmissionImage } from "./ai-analysis";
import { classifyAiDetection } from "./ai-detection";
import { classifyAiResult } from "./ai-result-classification";
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
    // FPC-55: Read existing duplicate detection result.
    const [existingAnalysis] = await tx
      .select({
        duplicateSuspectId:
          submissionAiAnalyses.duplicateSuspectId,
      })
      .from(submissionAiAnalyses)
      .where(
        eq(
          submissionAiAnalyses.submissionId,
          job.submissionId,
        ),
      )
      .limit(1);

    // FPC-55: Classify before saving.
    const classification = classifyAiResult({
      aiGeneratedProbability:
        result.aiGeneratedProbability,
      duplicateSuspectId:
        existingAnalysis?.duplicateSuspectId ?? null,
    });

    // Save AI analysis.
    await tx
      .insert(submissionAiAnalyses)
      .values({
        submissionId: job.submissionId,
        aiGeneratedProbability:
          result.aiGeneratedProbability.toFixed(4),
        isAiFlagged: detection.isAiFlagged,
        flagReasons: classification.reasons,
      })
      .onConflictDoUpdate({
        target: submissionAiAnalyses.submissionId,
        set: {
          aiGeneratedProbability:
            result.aiGeneratedProbability.toFixed(4),
          isAiFlagged: detection.isAiFlagged,
          flagReasons: classification.reasons,
        },
      });

    // FPC-55: Automatically update verification status.
    await tx
      .update(submissions)
      .set({
        status: classification.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(submissions.id, job.submissionId),
          inArray(submissions.status, [
            "PENDING_AI",
            "VERIFIED",
            "SUSPICIOUS",
          ]),
        ),
      );

    // Mark AI job as completed.
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
