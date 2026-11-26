import type { Context } from "hono";
import {
  enqueueBatchAiScan,
  enqueueSingleAiScan,
} from "../services/ai/ai-scan.service";
import {
  getAiThresholds,
  updateAiThresholds,
} from "../services/ai/ai-thresholds";
import { AppError } from "../utils/errors";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handleGetAiThresholds(c: Context) {
  return c.ok(getAiThresholds(), "AI thresholds retrieved successfully");
}

export async function handleUpdateAiThresholds(c: Context) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw AppError.badRequest("Invalid JSON body");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw AppError.badRequest("Invalid payload");
  }

  const data = body as Record<string, unknown>;
  if (
    data.aiGeneratedFlagThreshold === undefined &&
    data.duplicateMaxPhashDistance === undefined
  ) {
    throw AppError.badRequest(
      "At least one threshold field (aiGeneratedFlagThreshold or duplicateMaxPhashDistance) is required",
    );
  }

  try {
    const updated = updateAiThresholds({
      aiGeneratedFlagThreshold: data.aiGeneratedFlagThreshold as number | undefined,
      duplicateMaxPhashDistance: data.duplicateMaxPhashDistance as number | undefined,
    });
    return c.ok(updated, "AI thresholds updated successfully");
  } catch (error) {
    if (error instanceof RangeError) {
      throw AppError.badRequest(error.message);
    }
    throw error;
  }
}

export async function handleTriggerSingleAiScan(c: Context) {
  const { submissionId } = c.req.param();
  if (!UUID_REGEX.test(submissionId)) {
    throw AppError.badRequest("Invalid submissionId");
  }

  const job = await enqueueSingleAiScan(submissionId);
  return c.json(
    {
      code: 202,
      message: "AI verification scan queued",
      data: {
        jobId: job.id,
        submissionId: job.submissionId,
        status: job.status,
      },
      error: null,
    },
    202,
  );
}

export async function handleTriggerBatchAiScan(c: Context) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw AppError.badRequest("Invalid JSON body");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw AppError.badRequest("Invalid payload");
  }

  const data = body as Record<string, unknown>;
  if (typeof data.contestId !== "string" || !UUID_REGEX.test(data.contestId)) {
    throw AppError.badRequest("Invalid contestId");
  }

  let submissionIds: string[] | undefined;
  if (data.submissionIds !== undefined) {
    if (
      !Array.isArray(data.submissionIds) ||
      !data.submissionIds.every(
        (id) => typeof id === "string" && UUID_REGEX.test(id),
      )
    ) {
      throw AppError.badRequest("submissionIds must be an array of valid UUIDs");
    }
    submissionIds = data.submissionIds;
  }

  const result = await enqueueBatchAiScan(data.contestId, submissionIds);
  return c.json(
    {
      code: 202,
      message: "Batch AI verification scan queued",
      data: result,
      error: null,
    },
    202,
  );
}
