import type { Context } from "hono";
import type { AuthEnv } from "../middlewares/auth";
import {
  createContest,
  getContestById,
  getContestCategories,
  getContestResults,
  getContestScoreboard,
  listContests,
  softDeleteContest,
  updateContest,
  type UpdateContestInput,
} from "../services/contest.service";
import { AppError } from "../utils/errors";

const VALID_STATUSES = [
  "DRAFT",
  "OPEN",
  "UNDER_REVIEW",
  "JUDGING",
  "PUBLISHED",
  "ARCHIVED",
  "CANCELLED",
  "draft",
  "open",
  "under_review",
  "judging",
  "published",
  "archived",
  "cancelled",
  "ongoing",
  "completed",
];

function isValidStatus(value: unknown): value is string {
  return (
    typeof value === "string" &&
    VALID_STATUSES.some((s) => s.toLowerCase() === value.toLowerCase())
  );
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

async function parseJsonBody<T extends Record<string, unknown>>(
  c: Context,
): Promise<T> {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw AppError.badRequest("Invalid JSON body");
    }
    return body as T;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.badRequest("Invalid JSON body");
  }
}

export async function handleListContests(c: Context) {
  const search = c.req.query("search")?.trim();
  const status = c.req.query("status")?.trim();
  const createdBy =
    c.req.query("createdBy")?.trim() || c.req.query("created_by")?.trim();
  const pageParam = c.req.query("page") ?? "1";
  const limitParam = c.req.query("limit") ?? "10";

  if (!/^[1-9]\d*$/.test(pageParam)) {
    throw AppError.badRequest("Page must be a positive integer");
  }

  if (!/^[1-9]\d*$/.test(limitParam)) {
    throw AppError.badRequest("Limit must be a positive integer");
  }

  const page = Number(pageParam);
  const limit = Number(limitParam);

  if (!Number.isSafeInteger(page)) {
    throw AppError.badRequest("Invalid page value");
  }

  if (!Number.isSafeInteger(limit) || limit > 100) {
    throw AppError.badRequest("Limit must be between 1 and 100");
  }

  if (status && !isValidStatus(status)) {
    throw AppError.badRequest("Invalid contest status filter");
  }

  const data = await listContests({
    search,
    status,
    createdBy,
    page,
    limit,
  });

  return c.ok(data, "Contests retrieved successfully");
}

export async function handleGetContest(c: Context) {
  const { id } = c.req.param();
  const contest = await getContestById(id);
  return c.ok(contest, "Contest retrieved successfully");
}

export async function handleGetContestCategories(c: Context) {
  const { id } = c.req.param();
  const data = await getContestCategories(id);
  return c.ok(data, "Categories retrieved successfully");
}

export async function handleGetContestResults(c: Context) {
  const { id } = c.req.param();
  const data = await getContestResults(id);
  return c.ok(data, "Published results retrieved successfully");
}
export async function handleGetContestScoreboard(
  c: Context<AuthEnv>,
) {
  const { id } = c.req.param();
  const user = c.get("user");

  const data = await getContestScoreboard(id, user);

  return c.ok(data, "Scoreboard retrieved successfully");
}
export async function handleCreateContest(c: Context<AuthEnv>) {
  const body = await parseJsonBody<{
    name?: unknown;
    description?: unknown;
    startAt?: unknown;
    endAt?: unknown;
    status?: unknown;
  }>(c);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 150) {
    throw AppError.badRequest(
      "Name is required and must be at most 150 characters",
    );
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    throw AppError.badRequest("Description must be a string or null");
  }

  const status = body.status === undefined ? "draft" : body.status;
  if (!isValidStatus(status)) {
    throw AppError.badRequest("Invalid contest status");
  }

  if (
    body.startAt !== undefined &&
    body.startAt !== null &&
    !isValidDateString(body.startAt)
  ) {
    throw AppError.badRequest("Invalid startAt date");
  }

  if (
    body.endAt !== undefined &&
    body.endAt !== null &&
    !isValidDateString(body.endAt)
  ) {
    throw AppError.badRequest("Invalid endAt date");
  }

  const user = c.get("user");
  const created = await createContest({
    name,
    description:
      typeof body.description === "string" ? body.description.trim() : null,
    startAt: typeof body.startAt === "string" ? new Date(body.startAt) : null,
    endAt: typeof body.endAt === "string" ? new Date(body.endAt) : null,
    status,
    createdBy: user.id,
  });

  return c.created(created, "Contest created successfully");
}

export async function handleUpdateContest(c: Context<AuthEnv>) {
  const { id } = c.req.param();
  const body = await parseJsonBody<{
    name?: unknown;
    description?: unknown;
    startAt?: unknown;
    endAt?: unknown;
    status?: unknown;
  }>(c);

  if (
    body.name === undefined &&
    body.description === undefined &&
    body.startAt === undefined &&
    body.endAt === undefined &&
    body.status === undefined
  ) {
    throw AppError.badRequest("At least one field is required");
  }

  const input: UpdateContestInput = {};

  if (body.name !== undefined) {
    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      body.name.trim().length > 150
    ) {
      throw AppError.badRequest("Invalid contest name");
    }
    input.name = body.name.trim();
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      throw AppError.badRequest("Description must be a string or null");
    }
    input.description = body.description;
  }

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      throw AppError.badRequest("Invalid contest status");
    }
    input.status = body.status;
  }

  if (body.startAt !== undefined) {
    if (body.startAt !== null && !isValidDateString(body.startAt)) {
      throw AppError.badRequest("Invalid startAt date");
    }
    input.startAt =
      body.startAt === null ? null : new Date(body.startAt as string);
  }

  if (body.endAt !== undefined) {
    if (body.endAt !== null && !isValidDateString(body.endAt)) {
      throw AppError.badRequest("Invalid endAt date");
    }
    input.endAt = body.endAt === null ? null : new Date(body.endAt as string);
  }

  const updated = await updateContest(id, input, c.get("user"));
  return c.ok(updated, "Contest updated successfully");
}

export async function handleDeleteContest(c: Context<AuthEnv>) {
  const { id } = c.req.param();
  const deleted = await softDeleteContest(id, c.get("user"));
  return c.ok(deleted, "Contest deleted successfully (BR-03: Soft Delete)");
}
