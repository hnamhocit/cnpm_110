import type { Context } from "hono";
import { timingSafeEqual } from "node:crypto";
import {
  type AiWebhookPayload,
  processAiWebhookAnalysis,
} from "../services/ai/ai-webhook.service";
import { AppError } from "../utils/errors";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHASH_REGEX = /^[0-9a-f]{16}$/i;

function isValidSecret(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseWebhookPayload(raw: unknown): AiWebhookPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw AppError.badRequest("Invalid payload");
  }

  const data = raw as Record<string, unknown>;

  if (typeof data.submissionId !== "string" || !UUID_REGEX.test(data.submissionId)) {
    throw AppError.badRequest("Invalid submissionId");
  }

  if (typeof data.phashHex !== "string" || !PHASH_REGEX.test(data.phashHex)) {
    throw AppError.badRequest("Invalid phashHex");
  }

  if (
    typeof data.aiGeneratedProbability !== "number" ||
    !Number.isFinite(data.aiGeneratedProbability) ||
    data.aiGeneratedProbability < 0 ||
    data.aiGeneratedProbability > 1
  ) {
    throw AppError.badRequest("aiGeneratedProbability must be between 0 and 1");
  }

  if (
    !Array.isArray(data.predictedTags) ||
    data.predictedTags.length > 50 ||
    !data.predictedTags.every((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const tagItem = item as Record<string, unknown>;
      return (
        typeof tagItem.tag === "string" &&
        tagItem.tag.trim().length > 0 &&
        tagItem.tag.length <= 100 &&
        typeof tagItem.confidence === "number" &&
        Number.isFinite(tagItem.confidence) &&
        tagItem.confidence >= 0 &&
        tagItem.confidence <= 1
      );
    })
  ) {
    throw AppError.badRequest("Invalid predictedTags");
  }

  return {
    submissionId: data.submissionId,
    phashHex: data.phashHex,
    aiGeneratedProbability: data.aiGeneratedProbability,
    predictedTags: data.predictedTags as AiWebhookPayload["predictedTags"],
  };
}

export async function handleAiWebhook(c: Context) {
  const secret = process.env.AI_WEBHOOK_SECRET;
  if (!secret) {
    console.error("AI_WEBHOOK_SECRET is not configured");
    throw new AppError("Webhook unavailable", 503);
  }

  const providedSecret = c.req.header("X-Webhook-Secret");
  if (!isValidSecret(providedSecret, secret)) {
    throw AppError.unauthorized("Unauthorized webhook");
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw AppError.badRequest("Invalid JSON body");
  }

  const payload = parseWebhookPayload(body);
  const result = await processAiWebhookAnalysis(payload);

  return c.ok(result, "AI analysis saved successfully");
}
