import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { bodyLimit } from "hono/body-limit";
import { db } from "../db/index";
import {
  submissions,
  submissionAiAnalyses,
} from "../db/schema";
import { eq, ne, and, isNotNull } from "drizzle-orm";
import { findClosestDuplicate } from "../services/duplicate-detection";

const route = new Hono();

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validSecret(provided: string | undefined, expected: string) {
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/v1/ai/webhook
route.post(
  "/webhook",
  bodyLimit({
    maxSize: 64 * 1024,
    onError: (c) =>
      c.json({ success: false, message: "Payload too large" }, 413),
  }),
  async (c) => {
    const secret = process.env.AI_WEBHOOK_SECRET;

    if (!secret) {
      console.error("AI_WEBHOOK_SECRET is not configured");
      return c.json(
        { success: false, message: "Webhook unavailable" },
        503,
      );
    }

    const providedSecret = c.req.header("X-Webhook-Secret");

    if (!validSecret(providedSecret, secret)) {
      return c.json(
        { success: false, message: "Unauthorized webhook" },
        401,
      );
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { success: false, message: "Invalid JSON body" },
        400,
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return c.json(
        { success: false, message: "Invalid payload" },
        400,
      );
    }

    const data = body as Record<string, unknown>;

    if (
      typeof data.submissionId !== "string" ||
      !uuidRegex.test(data.submissionId)
    ) {
      return c.json(
        { success: false, message: "Invalid submissionId" },
        400,
      );
    }

    if (
      typeof data.phashHex !== "string" ||
      !/^[0-9a-f]{16}$/i.test(data.phashHex)
    ) {
      return c.json(
        { success: false, message: "Invalid phashHex" },
        400,
      );
    }

    if (
      typeof data.aiGeneratedProbability !== "number" ||
      !Number.isFinite(data.aiGeneratedProbability) ||
      data.aiGeneratedProbability < 0 ||
      data.aiGeneratedProbability > 1
    ) {
      return c.json(
        {
          success: false,
          message: "aiGeneratedProbability must be between 0 and 1",
        },
        400,
      );
    }

    if (
      !Array.isArray(data.predictedTags) ||
      data.predictedTags.length > 50 ||
      !data.predictedTags.every(
        (item: unknown) =>
          item !== null &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          typeof (item as Record<string, unknown>).tag === "string" &&
          ((item as Record<string, unknown>).tag as string).trim().length > 0 &&
          ((item as Record<string, unknown>).tag as string).length <= 100 &&
          typeof (item as Record<string, unknown>).confidence === "number" &&
          Number.isFinite((item as Record<string, number>).confidence) &&
          (item as Record<string, number>).confidence >= 0 &&
          (item as Record<string, number>).confidence <= 1
      )
    ) {
      return c.json(
        { success: false, message: "Invalid predictedTags" },
        400,
      );
    }


    try {
      const submissionId = data.submissionId as string;
      const phashHex = data.phashHex as string;
      const aiGeneratedProbability =
        data.aiGeneratedProbability as number;
      const predictedTags = data.predictedTags as {
        tag: string;
        confidence: number;
      }[];

      // Check whether the submission exists
      const [submission] = await db
        .select({ id: submissions.id })
        .from(submissions)
        .where(eq(submissions.id, submissionId))
        .limit(1);

      if (!submission) {
        return c.json(
          {
            success: false,
            message: "Submission not found",
          },
          404,
        );
      }
      // FPC-53: Find potentially duplicate submissions
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

      const duplicate = findClosestDuplicate(
        phashHex.toLowerCase(),
        candidates,
      );
      // Insert AI analysis or update the existing result
      await db
        .insert(submissionAiAnalyses)
        .values({
          submissionId,
          phashHex: phashHex.toLowerCase(),
          aiGeneratedProbability:
            aiGeneratedProbability.toFixed(4),
          predictedTags,
          isAiFlagged: false,
          duplicateSuspectId: duplicate?.submissionId ?? null,
          duplicateSimilarityScore: duplicate
            ? duplicate.similarityScore.toFixed(4)
            : null,
        })
        .onConflictDoUpdate({
          target: submissionAiAnalyses.submissionId,
          set: {
            phashHex: phashHex.toLowerCase(),
            aiGeneratedProbability:
              aiGeneratedProbability.toFixed(4),
            predictedTags,
            duplicateSuspectId: duplicate?.submissionId ?? null,
            duplicateSimilarityScore: duplicate
              ? duplicate.similarityScore.toFixed(4)
              : null,
          },
        });

      return c.json({
        success: true,
        message: "AI analysis saved successfully",
        data: {
          submissionId,
          phashHex,
          aiGeneratedProbability,
          predictedTags,
        },
      });
    } catch (error) {
      console.error("Failed to save AI analysis:", error);

      return c.json(
        {
          success: false,
          message: "Failed to save AI analysis",
        },
        500,
      );
    }

  },
);

export default route;
