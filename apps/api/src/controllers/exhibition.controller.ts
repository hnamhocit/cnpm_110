import type { Context } from "hono";
import type { AuthEnv } from "../middlewares/auth";
import {
  archiveContestWorks,
  getExhibitionStatus,
  getPublicExhibitionDetail,
  getPublicExhibitionImage,
  listContestExhibitions,
  listPublicExhibitions,
  processExhibitionImage,
  softDeleteExhibition,
  updateExhibitionStatus,
} from "../services/exhibition.service";
import { AppError } from "../utils/errors";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ARCHIVE_FLAGS = ["includeFinalists", "generateWebp", "applyWatermark", "publish"] as const;
const MANAGEABLE_STATUSES = ["PUBLISHED", "READY", "ARCHIVED"] as const;

function assertUuid(value: string | undefined, label: string): string {
  if (!value || !UUID_REGEX.test(value)) {
    throw AppError.badRequest(`Invalid ${label}`);
  }
  return value;
}

async function parseOptionalJsonObject(c: Context): Promise<Record<string, unknown>> {
  const raw = await c.req.text();
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw AppError.badRequest("Invalid JSON body");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.badRequest("Invalid JSON body");
  }
}

function assertBooleanFlags(body: Record<string, unknown>) {
  for (const flag of ARCHIVE_FLAGS) {
    if (body[flag] !== undefined && typeof body[flag] !== "boolean") {
      throw AppError.badRequest(`${flag} must be a boolean`);
    }
  }
}

/** POST /contests/:id/archive — UC-27: select eligible works for the digital archive. */
export async function handleArchiveContest(c: Context<AuthEnv>) {
  const contestId = assertUuid(c.req.param("id"), "contest ID");
  const body = await parseOptionalJsonObject(c);

  let submissionIds: string[] | undefined;
  if (body.submissionIds !== undefined) {
    if (!Array.isArray(body.submissionIds) || body.submissionIds.length === 0) {
      throw AppError.badRequest("submissionIds must be a non-empty array of UUIDs");
    }
    submissionIds = body.submissionIds.map((id) =>
      assertUuid(typeof id === "string" ? id : undefined, "submission ID"),
    );
  }

  assertBooleanFlags(body);

  const data = await archiveContestWorks(contestId, c.get("user").id, {
    submissionIds,
    includeFinalists: body.includeFinalists as boolean | undefined,
    generateWebp: body.generateWebp as boolean | undefined,
    applyWatermark: body.applyWatermark as boolean | undefined,
    publish: body.publish as boolean | undefined,
  });
  return c.ok(data, data.message, 202);
}

export async function handleListContestExhibitions(c: Context<AuthEnv>) {
  const contestId = assertUuid(c.req.param("id"), "contest ID");
  const data = await listContestExhibitions(contestId, c.get("user").id);
  return c.ok(data, "Contest exhibitions retrieved successfully");
}

function parsePageValue(raw: string | undefined, fallback: number, max: number) {
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw AppError.badRequest("page and limit must be positive integers");
  }
  return Math.min(value, max);
}

function parseYear(raw: string | undefined) {
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1900) {
    throw AppError.badRequest("year must be a valid four-digit year");
  }
  return value;
}

/** GET /exhibitions — public gallery; unauthenticated per CR-03. */
export async function handleListPublicExhibitions(c: Context<AuthEnv>) {
  const contestId = c.req.query("contestId");
  const data = await listPublicExhibitions({
    contestId: contestId ? assertUuid(contestId, "contestId") : undefined,
    year: parseYear(c.req.query("year")),
    award: c.req.query("award"),
    filmStock: c.req.query("filmStock"),
    camera: c.req.query("camera"),
    filmFormat: c.req.query("filmFormat"),
    aiTag: c.req.query("aiTag"),
    page: parsePageValue(c.req.query("page"), 1, 10_000),
    limit: parsePageValue(c.req.query("limit"), 20, 100),
  });
  return c.ok(data, "Exhibitions retrieved successfully");
}

export async function handleGetPublicExhibitionDetail(c: Context<AuthEnv>) {
  const id = assertUuid(c.req.param("id"), "exhibition ID");
  const data = await getPublicExhibitionDetail(id);
  return c.ok(data, "Exhibition detail retrieved successfully");
}

export async function handleGetPublicExhibitionImage(c: Context<AuthEnv>) {
  const id = assertUuid(c.req.param("id"), "exhibition ID");
  return getPublicExhibitionImage(id);
}

export async function handleProcessExhibitionImage(c: Context<AuthEnv>) {
  const id = assertUuid(c.req.param("id"), "exhibition ID");
  const body = await parseOptionalJsonObject(c);
  assertBooleanFlags(body);
  const data = await processExhibitionImage(id, c.get("user").id, {
    generateWebp: body.generateWebp as boolean | undefined,
    applyWatermark: body.applyWatermark as boolean | undefined,
    publish: body.publish as boolean | undefined,
  });
  return c.ok(data, "Exhibition preview processed successfully");
}

export async function handleGetExhibitionStatus(c: Context<AuthEnv>) {
  const id = assertUuid(c.req.param("id"), "exhibition ID");
  const data = await getExhibitionStatus(id, c.get("user").id);
  return c.ok(data, "Exhibition status retrieved successfully");
}

export async function handleUpdateExhibitionStatus(c: Context<AuthEnv>) {
  const id = assertUuid(c.req.param("id"), "exhibition ID");
  const body = await parseOptionalJsonObject(c);
  const status = body.status;
  if (typeof status !== "string" || !MANAGEABLE_STATUSES.includes(status as (typeof MANAGEABLE_STATUSES)[number])) {
    throw AppError.badRequest("status must be one of PUBLISHED, READY or ARCHIVED");
  }
  const data = await updateExhibitionStatus(id, c.get("user").id, status as (typeof MANAGEABLE_STATUSES)[number]);
  return c.ok(data, "Exhibition status updated successfully");
}

export async function handleDeleteExhibition(c: Context<AuthEnv>) {
  const id = assertUuid(c.req.param("id"), "exhibition ID");
  const data = await softDeleteExhibition(id, c.get("user").id);
  return c.ok(data, "Exhibition item removed from the public gallery");
}
