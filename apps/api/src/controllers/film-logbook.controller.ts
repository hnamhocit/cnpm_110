import type { Context } from "hono";
import { UUID_PATTERN, type AuthEnv } from "../middlewares/auth";
import {
  createFilmRoll,
  createRollFrame,
  getFilmRollDetail,
  listMyFilmRolls,
  listRollFrames,
  softDeleteFilmRoll,
  softDeleteRollFrame,
  updateFilmRoll,
  updateRollFrame,
} from "../services/film-logbook.service";
import { AppError } from "../utils/errors";

function requireUuid(id: string | undefined, label: string): string {
  if (!id || !UUID_PATTERN.test(id)) {
    throw AppError.badRequest(`MSG002: Invalid ${label} ID`);
  }
  return id;
}

async function parseJsonBody(c: Context): Promise<unknown> {
  return c.req.json().catch(() => {
    throw AppError.badRequest("MSG002: Invalid JSON body");
  });
}

export async function handleListFilmRolls(c: Context<AuthEnv>) {
  const pageRaw = c.req.query("page");
  const limitRaw = c.req.query("limit");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : undefined;
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  const data = await listMyFilmRolls(c.get("user").id, {
    status: c.req.query("status") || undefined,
    format: c.req.query("format") || undefined,
    page: Number.isFinite(page) ? page : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
  });
  return c.ok(data);
}

export async function handleCreateFilmRoll(c: Context<AuthEnv>) {
  const body = await parseJsonBody(c);
  const created = await createFilmRoll(body, c.get("user").id);
  return c.created(created, "Film roll created");
}

export async function handleGetFilmRoll(c: Context<AuthEnv>) {
  const rollId = requireUuid(c.req.param("id"), "film roll");
  const roll = await getFilmRollDetail(rollId, c.get("user").id);
  return c.ok(roll);
}

export async function handleUpdateFilmRoll(c: Context<AuthEnv>) {
  const rollId = requireUuid(c.req.param("id"), "film roll");
  const body = await parseJsonBody(c);
  const updated = await updateFilmRoll(rollId, body, c.get("user").id);
  return c.ok(updated, "Film roll updated");
}

export async function handleDeleteFilmRoll(c: Context<AuthEnv>) {
  const rollId = requireUuid(c.req.param("id"), "film roll");
  const deleted = await softDeleteFilmRoll(rollId, c.get("user").id);
  return c.ok(deleted, "Film roll deleted");
}

export async function handleListRollFrames(c: Context<AuthEnv>) {
  const rollId = requireUuid(c.req.param("id"), "film roll");
  const frames = await listRollFrames(rollId, c.get("user").id);
  return c.ok({ items: frames });
}

export async function handleCreateRollFrame(c: Context<AuthEnv>) {
  const rollId = requireUuid(c.req.param("id"), "film roll");
  const body = await parseJsonBody(c);
  const created = await createRollFrame(rollId, body, c.get("user").id);
  return c.created(created, "Frame log created");
}

export async function handleUpdateRollFrame(c: Context<AuthEnv>) {
  const rollId = requireUuid(c.req.param("id"), "film roll");
  const frameId = requireUuid(c.req.param("frameId"), "frame");
  const body = await parseJsonBody(c);
  const updated = await updateRollFrame(rollId, frameId, body, c.get("user").id);
  return c.ok(updated, "Frame log updated");
}

export async function handleDeleteRollFrame(c: Context<AuthEnv>) {
  const rollId = requireUuid(c.req.param("id"), "film roll");
  const frameId = requireUuid(c.req.param("frameId"), "frame");
  const deleted = await softDeleteRollFrame(rollId, frameId, c.get("user").id);
  return c.ok(deleted, "Frame log deleted");
}
