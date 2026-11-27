import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { cameras, filmLabs, filmStocks, lenses } from "../db/schemas/module-2.schema";
import { filmRolls, frameLogs } from "../db/schemas/module-4.schema";
import { AppError } from "../utils/errors";
import {
  formatPushPullEv,
  getMaxFramesForFormat,
  ROLL_STATUSES,
  validateFilmRollInput,
  validateFrameLogInput,
  validateRollStatusTransition,
  type RollStatus,
} from "./film-logbook.validation";

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const record = err as { code?: string; cause?: { code?: string } };
  return record.code === "23505" || record.cause?.code === "23505";
}

function isForeignKeyViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const record = err as { code?: string; cause?: { code?: string } };
  return record.code === "23503" || record.cause?.code === "23503";
}

async function getOwnedRoll(rollId: string, userId: string) {
  const [roll] = await db
    .select()
    .from(filmRolls)
    .where(and(eq(filmRolls.id, rollId), eq(filmRolls.isDeleted, false)));

  if (!roll) {
    throw AppError.notFound("MSG001: Film roll not found");
  }
  if (roll.userId !== userId) {
    throw AppError.forbidden("MSG005: You do not own this film roll");
  }
  return roll;
}

async function countActiveFrames(rollId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(frameLogs)
    .where(and(eq(frameLogs.rollId, rollId), eq(frameLogs.isDeleted, false)));
  return row?.count ?? 0;
}

export async function listMyFilmRolls(
  userId: string,
  opts: { status?: string; format?: string; page?: number; limit?: number },
) {
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 10;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [
    eq(filmRolls.userId, userId),
    eq(filmRolls.isDeleted, false),
  ];
  if (opts.status) conditions.push(eq(filmRolls.status, opts.status));
  if (opts.format) conditions.push(eq(filmRolls.format, opts.format));

  const where = and(...conditions);
  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(filmRolls)
      .where(where)
      .orderBy(desc(filmRolls.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(filmRolls).where(where),
  ]);

  const rollIds = rows.map((r) => r.id);
  const frameCountMap = new Map<string, number>();
  if (rollIds.length > 0) {
    const counts = await db
      .select({
        rollId: frameLogs.rollId,
        count: sql<number>`count(*)::int`,
      })
      .from(frameLogs)
      .where(
        and(inArray(frameLogs.rollId, rollIds), eq(frameLogs.isDeleted, false)),
      )
      .groupBy(frameLogs.rollId);
    for (const c of counts) frameCountMap.set(c.rollId, c.count);
  }

  const items = rows.map((r) => ({
    ...r,
    pushPullEv: formatPushPullEv(r.isoRated, r.isoShot),
    loggedFramesCount: frameCountMap.get(r.id) ?? 0,
    maxFrames: getMaxFramesForFormat(r.format),
  }));

  return {
    items,
    totalItems: countRows[0]?.count ?? 0,
    currentPage: page,
    pageSize: limit,
  };
}

export async function createFilmRoll(raw: unknown, userId: string) {
  const input = validateFilmRollInput(raw);
  try {
    const [created] = await db
      .insert(filmRolls)
      .values({
        ...input,
        userId,
        status: "SHOOTING",
      })
      .returning();
    if (!created) throw new AppError("Failed to create film roll", 500);
    return {
      ...created,
      pushPullEv: formatPushPullEv(created.isoRated, created.isoShot),
      loggedFramesCount: 0,
      maxFrames: getMaxFramesForFormat(created.format),
    };
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw AppError.badRequest(
        "MSG002: Referenced filmStockId, cameraId, or labId does not exist",
      );
    }
    throw err;
  }
}

export async function getFilmRollDetail(rollId: string, userId: string) {
  const roll = await getOwnedRoll(rollId, userId);

  const [frames, filmStockRows, cameraRows, labRows] = await Promise.all([
    db
      .select()
      .from(frameLogs)
      .where(and(eq(frameLogs.rollId, rollId), eq(frameLogs.isDeleted, false)))
      .orderBy(asc(frameLogs.frameNumber)),
    roll.filmStockId
      ? db.select().from(filmStocks).where(eq(filmStocks.id, roll.filmStockId))
      : Promise.resolve([]),
    roll.cameraId
      ? db.select().from(cameras).where(eq(cameras.id, roll.cameraId))
      : Promise.resolve([]),
    roll.labId
      ? db.select().from(filmLabs).where(eq(filmLabs.id, roll.labId))
      : Promise.resolve([]),
  ]);

  return {
    ...roll,
    filmStock: filmStockRows[0] ?? null,
    camera: cameraRows[0] ?? null,
    lab: labRows[0] ?? null,
    pushPullEv: formatPushPullEv(roll.isoRated, roll.isoShot),
    loggedFramesCount: frames.length,
    maxFrames: getMaxFramesForFormat(roll.format),
    frames,
  };
}

export async function updateFilmRoll(rollId: string, raw: unknown, userId: string) {
  const existing = await getOwnedRoll(rollId, userId);
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const merged = {
    filmStockId:
      body.filmStockId !== undefined
        ? body.filmStockId
        : body.film_stock_id !== undefined
          ? body.film_stock_id
          : existing.filmStockId,
    customFilmName:
      body.customFilmName !== undefined
        ? body.customFilmName
        : body.custom_film_name !== undefined
          ? body.custom_film_name
          : existing.customFilmName,
    format: body.format ?? existing.format,
    isoRated: body.isoRated ?? body.iso_rated ?? existing.isoRated,
    isoShot: body.isoShot ?? body.iso_shot ?? existing.isoShot,
    cameraId:
      body.cameraId !== undefined
        ? body.cameraId
        : body.camera_id !== undefined
          ? body.camera_id
          : existing.cameraId,
    customCameraName:
      body.customCameraName !== undefined
        ? body.customCameraName
        : body.custom_camera_name !== undefined
          ? body.custom_camera_name
          : existing.customCameraName,
    labId:
      body.labId !== undefined
        ? body.labId
        : body.lab_id !== undefined
          ? body.lab_id
          : existing.labId,
    customLabName:
      body.customLabName !== undefined
        ? body.customLabName
        : body.custom_lab_name !== undefined
          ? body.custom_lab_name
          : existing.customLabName,
    devProcess: body.devProcess ?? body.dev_process ?? existing.devProcess,
    loadDate: body.loadDate ?? body.load_date ?? existing.loadDate,
    devDate:
      body.devDate !== undefined
        ? body.devDate
        : body.dev_date !== undefined
          ? body.dev_date
          : existing.devDate,
    notes: body.notes !== undefined ? body.notes : existing.notes,
  };

  const input = validateFilmRollInput(merged);
  const nextStatusRaw = body.status ?? existing.status;
  if (
    typeof nextStatusRaw !== "string" ||
    !ROLL_STATUSES.includes(nextStatusRaw as RollStatus)
  ) {
    throw AppError.badRequest(
      `MSG002: status must be one of: ${ROLL_STATUSES.join(", ")}`,
    );
  }
  const nextStatus = nextStatusRaw as RollStatus;

  const loggedFramesCount = await countActiveFrames(rollId);
  validateRollStatusTransition(existing.status as RollStatus, nextStatus, {
    loggedFramesCount,
    devDate: input.devDate,
  });

  try {
    const [updated] = await db
      .update(filmRolls)
      .set({
        ...input,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(filmRolls.id, rollId))
      .returning();

    return {
      ...updated,
      pushPullEv: formatPushPullEv(input.isoRated, input.isoShot),
      loggedFramesCount,
      maxFrames: getMaxFramesForFormat(input.format),
    };
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw AppError.badRequest(
        "MSG002: Referenced filmStockId, cameraId, or labId does not exist",
      );
    }
    throw err;
  }
}

export async function softDeleteFilmRoll(rollId: string, userId: string) {
  await getOwnedRoll(rollId, userId);
  const now = new Date();
  await db
    .update(frameLogs)
    .set({ isDeleted: true, updatedAt: now })
    .where(and(eq(frameLogs.rollId, rollId), eq(frameLogs.isDeleted, false)));

  const [deleted] = await db
    .update(filmRolls)
    .set({ isDeleted: true, updatedAt: now })
    .where(eq(filmRolls.id, rollId))
    .returning();
  return deleted;
}

// --- Frames (UC-36) ---

export async function listRollFrames(rollId: string, userId: string) {
  await getOwnedRoll(rollId, userId);
  return db
    .select()
    .from(frameLogs)
    .where(and(eq(frameLogs.rollId, rollId), eq(frameLogs.isDeleted, false)))
    .orderBy(asc(frameLogs.frameNumber));
}

export async function createRollFrame(rollId: string, raw: unknown, userId: string) {
  const roll = await getOwnedRoll(rollId, userId);
  if (roll.status !== "SHOOTING") {
    throw AppError.badRequest(
      `MSG002: Cannot add new frames when roll status is ${roll.status}`,
    );
  }
  const input = validateFrameLogInput(raw, roll.format);

  try {
    const [created] = await db
      .insert(frameLogs)
      .values({
        ...input,
        rollId,
      })
      .returning();
    return created;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        `MSG002: Frame number ${input.frameNumber} already exists in this film roll`,
      );
    }
    if (isForeignKeyViolation(err)) {
      throw AppError.badRequest("MSG002: Referenced lensId does not exist");
    }
    throw err;
  }
}

export async function updateRollFrame(
  rollId: string,
  frameId: string,
  raw: unknown,
  userId: string,
) {
  const roll = await getOwnedRoll(rollId, userId);
  const [existing] = await db
    .select()
    .from(frameLogs)
    .where(
      and(
        eq(frameLogs.id, frameId),
        eq(frameLogs.rollId, rollId),
        eq(frameLogs.isDeleted, false),
      ),
    );
  if (!existing) throw AppError.notFound("MSG001: Frame log not found");

  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = {
    frameNumber: body.frameNumber ?? body.frame_number ?? existing.frameNumber,
    lensId:
      body.lensId !== undefined
        ? body.lensId
        : body.lens_id !== undefined
          ? body.lens_id
          : existing.lensId,
    customLensName:
      body.customLensName !== undefined
        ? body.customLensName
        : body.custom_lens_name !== undefined
          ? body.custom_lens_name
          : existing.customLensName,
    focalLengthMm:
      body.focalLengthMm !== undefined
        ? body.focalLengthMm
        : body.focal_length_mm !== undefined
          ? body.focal_length_mm
          : existing.focalLengthMm,
    aperture: body.aperture !== undefined ? body.aperture : existing.aperture,
    shutterSpeed:
      body.shutterSpeed !== undefined
        ? body.shutterSpeed
        : body.shutter_speed !== undefined
          ? body.shutter_speed
          : existing.shutterSpeed,
    exposureCompensation:
      body.exposureCompensation !== undefined
        ? body.exposureCompensation
        : body.exposure_compensation !== undefined
          ? body.exposure_compensation
          : existing.exposureCompensation,
    filterUsed:
      body.filterUsed !== undefined
        ? body.filterUsed
        : body.filter_used !== undefined
          ? body.filter_used
          : existing.filterUsed,
    locationName:
      body.locationName !== undefined
        ? body.locationName
        : body.location_name !== undefined
          ? body.location_name
          : existing.locationName,
    latitude:
      body.latitude !== undefined
        ? body.latitude
        : existing.latitude === null
          ? null
          : Number(existing.latitude),
    longitude:
      body.longitude !== undefined
        ? body.longitude
        : existing.longitude === null
          ? null
          : Number(existing.longitude),
    shotAt:
      body.shotAt !== undefined
        ? body.shotAt
        : body.shot_at !== undefined
          ? body.shot_at
          : existing.shotAt?.toISOString() ?? null,
    scannedImageAssetId:
      body.scannedImageAssetId !== undefined
        ? body.scannedImageAssetId
        : body.scanned_image_asset_id !== undefined
          ? body.scanned_image_asset_id
          : existing.scannedImageAssetId,
    notes: body.notes !== undefined ? body.notes : existing.notes,
  };

  const input = validateFrameLogInput(merged, roll.format);
  try {
    const [updated] = await db
      .update(frameLogs)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(frameLogs.id, frameId))
      .returning();
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        `MSG002: Frame number ${input.frameNumber} already exists in this film roll`,
      );
    }
    if (isForeignKeyViolation(err)) {
      throw AppError.badRequest("MSG002: Referenced lensId does not exist");
    }
    throw err;
  }
}

export async function softDeleteRollFrame(
  rollId: string,
  frameId: string,
  userId: string,
) {
  await getOwnedRoll(rollId, userId);
  const [deleted] = await db
    .update(frameLogs)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(
      and(
        eq(frameLogs.id, frameId),
        eq(frameLogs.rollId, rollId),
        eq(frameLogs.isDeleted, false),
      ),
    )
    .returning();
  if (!deleted) throw AppError.notFound("MSG001: Frame log not found");
  return deleted;
}
