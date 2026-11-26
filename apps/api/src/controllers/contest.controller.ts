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
import {
  categoryCriteria,
  createConfiguredContest,
  duplicateContest,
  saveCategory,
  scheduleFields,
} from "../services/contest-configuration";
import {
  categoryPatch,
  fullSchedule,
  parseCategories,
  parseCriteria,
  requiredText,
  schedulePatch,
  settingsPatch,
  type Body,
} from "./contest-configuration.input";
import { AppError } from "../utils/errors";

const VALID_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "VERIFYING",
  "IN_JUDGING",
  "RESULTS_PUBLISHED",
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
  const contest = await getContestById(resourceId(id));
  return c.ok(contest, "Contest retrieved successfully");
}

export async function handleGetContestCategories(c: Context) {
  const { id } = c.req.param();
  const data = await getContestCategories(resourceId(id));
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
  const body = await parseJsonBody<Body>(c);

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

  const settings = settingsPatch(body);
  const configured = Object.keys(settings).length > 0 || body.categories !== undefined ||
    Object.keys(scheduleFields).some((field) => body[field] !== undefined);
  if (configured) {
    if (body.startAt !== undefined || body.endAt !== undefined || status.toLowerCase() !== "draft") {
      throw AppError.badRequest("Configured contests start in DRAFT and use the five milestone fields");
    }
    const created = await createConfiguredContest({
      ...settings,
      ...fullSchedule(body),
      name,
      description: typeof body.description === "string" ? body.description.trim() : null,
      createdBy: c.get("user").id,
    }, parseCategories(body.categories));
    return c.created(created, "MSG006: Contest created successfully");
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
  const body = await parseJsonBody<Body>(c);
  if (body.categories !== undefined) throw AppError.badRequest("Use the category endpoints to update categories");
  const dates = schedulePatch(body);
  if ((body.startAt !== undefined && dates.startAt !== undefined) ||
      (body.endAt !== undefined && dates.endAt !== undefined)) {
    throw AppError.badRequest("Send each milestone once");
  }

  const input: UpdateContestInput = { ...settingsPatch(body), ...dates };

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

  if (Object.keys(input).length === 0) throw AppError.badRequest("At least one field is required");
  const updated = await updateContest(resourceId(id), input, c.get("user"));
  return c.ok(updated, "Contest updated successfully");
}

export async function handleDeleteContest(c: Context<AuthEnv>) {
  const { id } = c.req.param();
  const deleted = await softDeleteContest(id, c.get("user"));
  return c.ok(deleted, "Contest deleted successfully (BR-03: Soft Delete)");
}

function resourceId(value: string | undefined) {
  if (!value || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
    throw AppError.badRequest("Invalid resource ID");
  }
  return value;
}

export async function handleDuplicateContest(c: Context<AuthEnv>) {
  const body = await parseJsonBody<Body>(c);
  const name = body.name === undefined ? undefined : requiredText(body.name, "name", 150);
  const data = await duplicateContest(resourceId(c.req.param("id")), c.get("user").id, fullSchedule(body), name);
  return c.created(data, "MSG006: Contest duplicated successfully");
}

export async function handleCreateCategory(c: Context<AuthEnv>) {
  const body = await parseJsonBody<Body>(c);
  const input = { ...categoryPatch(body), name: requiredText(body.name, "category name", 100) };
  const data = await saveCategory(resourceId(c.req.param("id")), c.get("user").id, input);
  return c.created(data, "Category created successfully");
}

export async function handleUpdateCategory(c: Context<AuthEnv>) {
  const input = c.req.method === "DELETE" ? { isActive: false } : categoryPatch(await parseJsonBody<Body>(c));
  if (Object.keys(input).length === 0) throw AppError.badRequest("At least one category field is required");
  const data = await saveCategory(resourceId(c.req.param("id")), c.get("user").id, input, resourceId(c.req.param("categoryId")));
  return c.ok(data, "Category updated successfully");
}

export async function handleCategoryCriteria(c: Context<AuthEnv>) {
  const replacement = c.req.method === "PUT" ? parseCriteria((await parseJsonBody<Body>(c)).criteria) : undefined;
  const data = await categoryCriteria(resourceId(c.req.param("id")), resourceId(c.req.param("categoryId")), c.get("user").id, replacement);
  return c.ok(data, replacement ? "Category criteria replaced successfully" : "Category criteria retrieved successfully");
}
