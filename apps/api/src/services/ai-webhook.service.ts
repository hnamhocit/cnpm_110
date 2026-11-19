import { and, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { db } from "../db/index";
import { submissionAiAnalyses, submissions } from "../db/schema";
import { AppError } from "../utils/errors";
import { classifyAiDetection } from "./ai-detection";
import { classifyAiResult } from "./ai-result-classification";
import { findClosestDuplicate } from "./duplicate-detection";

export interface PredictedTagInput {
  tag: string;
  confidence: number;
}

export interface AiWebhookPayload {
  submissionId: string;
  phashHex: string;
  aiGeneratedProbability: number;
  predictedTags: PredictedTagInput[];
}

export async function processAiWebhookAnalysis(payload: AiWebhookPayload) {
  const { submissionId, aiGeneratedProbability, predictedTags } = payload;
  const normalizedPhash = payload.phashHex.toLowerCase();

  // 1. Kiểm tra submission tồn tại
  const [submission] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!submission) {
    throw AppError.notFound("Submission not found");
  }

  // 2. Tìm ảnh trùng lặp tiềm năng bằng pHash
  const existingAnalyses = await db
    .select({
      submissionId: submissionAiAnalyses.submissionId,
      phashHex: submissionAiAnalyses.phashHex,
    })
    .from(submissionAiAnalyses)
    .where(
      and(
        ne(submissionAiAnalyses.submissionId, submissionId),
        isNotNull(submissionAiAnalyses.phashHex),
      ),
    );

  const candidates = existingAnalyses
    .filter(
      (item): item is { submissionId: string; phashHex: string } =>
        item.phashHex !== null,
    )
    .map((item) => ({
      submissionId: item.submissionId,
      phashHex: item.phashHex,
    }));

  const duplicate = findClosestDuplicate(normalizedPhash, candidates);

  // 3. Phân loại kết quả phát hiện AI & trạng thái xác minh
  const aiDetection = classifyAiDetection(aiGeneratedProbability);
  const classification = classifyAiResult({
    aiGeneratedProbability,
    duplicateSuspectId: duplicate?.submissionId ?? null,
  });

  const duplicateSuspectId = duplicate?.submissionId ?? null;
  const duplicateSimilarityScore = duplicate
    ? duplicate.similarityScore.toFixed(4)
    : null;

  // 4. Lưu kết quả phân tích & cập nhật trạng thái submission trong 1 transaction
  await db.transaction(async (tx) => {
    await tx
      .insert(submissionAiAnalyses)
      .values({
        submissionId,
        phashHex: normalizedPhash,
        aiGeneratedProbability: aiGeneratedProbability.toFixed(4),
        predictedTags,
        isAiFlagged: aiDetection.isAiFlagged,
        flagReasons: classification.reasons,
        duplicateSuspectId,
        duplicateSimilarityScore,
      })
      .onConflictDoUpdate({
        target: submissionAiAnalyses.submissionId,
        set: {
          phashHex: normalizedPhash,
          aiGeneratedProbability: aiGeneratedProbability.toFixed(4),
          predictedTags,
          duplicateSuspectId,
          duplicateSimilarityScore,
          isAiFlagged: aiDetection.isAiFlagged,
          flagReasons: classification.reasons,
        },
      });

    await tx
      .update(submissions)
      .set({
        status: classification.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(submissions.id, submissionId),
          inArray(submissions.status, [
            "PENDING_AI",
            "VERIFIED",
            "SUSPICIOUS",
          ]),
        ),
      );
  });

  return {
    submissionId,
    phashHex: normalizedPhash,
    aiGeneratedProbability,
    predictedTags,
    isAiFlagged: aiDetection.isAiFlagged,
    riskLevel: aiDetection.riskLevel,
    verificationStatus: classification.status,
    flagReasons: classification.reasons,
  };
}
