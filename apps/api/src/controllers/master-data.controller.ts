import type { Context } from "hono";
import { verify } from "hono/jwt";
import { UUID_PATTERN, type AuthEnv } from "../middlewares/auth";
import {
  createCamera,
  createFilmLab,
  createFilmStock,
  createLens,
  getCameraById,
  getFilmLabById,
  getFilmStockById,
  getLensById,
  listCameras,
  listFilmLabs,
  listFilmStocks,
  listLenses,
  restoreCamera,
  restoreFilmLab,
  restoreFilmStock,
  restoreLens,
  softDeleteCamera,
  softDeleteFilmLab,
  softDeleteFilmStock,
  softDeleteLens,
  updateCamera,
  updateFilmLab,
  updateFilmStock,
  updateLens,
  type ListQueryOptions,
} from "../services/master-data.service";
import { AppError } from "../utils/errors";

function requireUuid(id: string | undefined, label: string): string {
  if (!id || !UUID_PATTERN.test(id)) {
    throw AppError.badRequest(`MSG002: Invalid ${label} ID`);
  }
  return id;
}

async function isAdminRequest(c: Context): Promise<boolean> {
  const authorization = c.req.header("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const secret = Bun.env.JWT_SECRET;
  if (!token || !secret) return false;
  const payload = await verify(token, secret, "HS256").catch(() => null);
  return Boolean(payload && payload.role === "Admin");
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalBool(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

async function parseListOptions(c: Context): Promise<ListQueryOptions> {
  const admin = await isAdminRequest(c);
  const rawStatus = c.req.query("status")?.toUpperCase();
  const allowedStatuses = ["ACTIVE", "DRAFT", "DEPRECATED", "ALL"] as const;
  const requestedStatus = allowedStatuses.includes(
    rawStatus as (typeof allowedStatuses)[number],
  )
    ? (rawStatus as ListQueryOptions["status"])
    : "ACTIVE";

  return {
    search: c.req.query("search") || undefined,
    brand: c.req.query("brand") || undefined,
    process: c.req.query("process") || undefined,
    format: c.req.query("format") || undefined,
    cameraType: c.req.query("camera_type") || undefined,
    mountType: c.req.query("mount_type") || undefined,
    isPrime: parseOptionalBool(c.req.query("is_prime")),
    countryCode: c.req.query("country_code") || undefined,
    city: c.req.query("city") || undefined,
    scanner: c.req.query("scanner") || undefined,
    verifiedOnly: parseOptionalBool(c.req.query("verified_only")),
    status: admin ? requestedStatus : "ACTIVE",
    includeDeleted: admin ? c.req.query("include_deleted") === "true" : false,
    page: parseOptionalInt(c.req.query("page")),
    limit: parseOptionalInt(c.req.query("limit")),
  };
}

async function parseJsonBody(c: Context): Promise<unknown> {
  return c.req.json().catch(() => {
    throw AppError.badRequest("MSG002: Invalid JSON body");
  });
}

// --- Film Stocks ---

export async function handleListFilmStocks(c: Context) {
  const opts = await parseListOptions(c);
  const result = await listFilmStocks(opts);
  return c.ok(result);
}

export async function handleGetFilmStock(c: Context) {
  const id = requireUuid(c.req.param("id"), "film stock");
  const item = await getFilmStockById(id);
  return c.ok(item);
}

export async function handleCreateFilmStock(c: Context<AuthEnv>) {
  const body = await parseJsonBody(c);
  const item = await createFilmStock(body, c.get("user").id);
  return c.created(item, "Film stock created");
}

export async function handleUpdateFilmStock(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "film stock");
  const body = await parseJsonBody(c);
  const item = await updateFilmStock(id, body, c.get("user").id);
  return c.ok(item, "Film stock updated");
}

export async function handleDeleteFilmStock(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "film stock");
  const item = await softDeleteFilmStock(id, c.get("user").id);
  return c.ok(item, "Film stock soft-deleted");
}

export async function handleRestoreFilmStock(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "film stock");
  const item = await restoreFilmStock(id, c.get("user").id);
  return c.ok(item, "Film stock restored");
}

// --- Cameras ---

export async function handleListCameras(c: Context) {
  const opts = await parseListOptions(c);
  const result = await listCameras(opts);
  return c.ok(result);
}

export async function handleGetCamera(c: Context) {
  const id = requireUuid(c.req.param("id"), "camera");
  const item = await getCameraById(id);
  return c.ok(item);
}

export async function handleCreateCamera(c: Context<AuthEnv>) {
  const body = await parseJsonBody(c);
  const item = await createCamera(body, c.get("user").id);
  return c.created(item, "Camera created");
}

export async function handleUpdateCamera(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "camera");
  const body = await parseJsonBody(c);
  const item = await updateCamera(id, body, c.get("user").id);
  return c.ok(item, "Camera updated");
}

export async function handleDeleteCamera(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "camera");
  const item = await softDeleteCamera(id, c.get("user").id);
  return c.ok(item, "Camera soft-deleted");
}

export async function handleRestoreCamera(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "camera");
  const item = await restoreCamera(id, c.get("user").id);
  return c.ok(item, "Camera restored");
}

// --- Lenses ---

export async function handleListLenses(c: Context) {
  const opts = await parseListOptions(c);
  const result = await listLenses(opts);
  return c.ok(result);
}

export async function handleGetLens(c: Context) {
  const id = requireUuid(c.req.param("id"), "lens");
  const item = await getLensById(id);
  return c.ok(item);
}

export async function handleCreateLens(c: Context<AuthEnv>) {
  const body = await parseJsonBody(c);
  const item = await createLens(body, c.get("user").id);
  return c.created(item, "Lens created");
}

export async function handleUpdateLens(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "lens");
  const body = await parseJsonBody(c);
  const item = await updateLens(id, body, c.get("user").id);
  return c.ok(item, "Lens updated");
}

export async function handleDeleteLens(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "lens");
  const item = await softDeleteLens(id, c.get("user").id);
  return c.ok(item, "Lens soft-deleted");
}

export async function handleRestoreLens(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "lens");
  const item = await restoreLens(id, c.get("user").id);
  return c.ok(item, "Lens restored");
}

// --- Film Labs ---

export async function handleListFilmLabs(c: Context) {
  const opts = await parseListOptions(c);
  const result = await listFilmLabs(opts);
  return c.ok(result);
}

export async function handleGetFilmLab(c: Context) {
  const id = requireUuid(c.req.param("id"), "film lab");
  const item = await getFilmLabById(id);
  return c.ok(item);
}

export async function handleCreateFilmLab(c: Context<AuthEnv>) {
  const body = await parseJsonBody(c);
  const item = await createFilmLab(body, c.get("user").id);
  return c.created(item, "Film lab created");
}

export async function handleUpdateFilmLab(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "film lab");
  const body = await parseJsonBody(c);
  const item = await updateFilmLab(id, body, c.get("user").id);
  return c.ok(item, "Film lab updated");
}

export async function handleDeleteFilmLab(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "film lab");
  const item = await softDeleteFilmLab(id, c.get("user").id);
  return c.ok(item, "Film lab soft-deleted");
}

export async function handleRestoreFilmLab(c: Context<AuthEnv>) {
  const id = requireUuid(c.req.param("id"), "film lab");
  const item = await restoreFilmLab(id, c.get("user").id);
  return c.ok(item, "Film lab restored");
}
