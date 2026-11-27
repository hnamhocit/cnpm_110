import { UUID_PATTERN } from "../middlewares/auth";
import { AppError } from "../utils/errors";

export const LOGBOOK_FORMATS = [
  "135",
  "120_645",
  "120_66",
  "120_67",
  "4x5",
] as const;
export type LogbookFormat = (typeof LOGBOOK_FORMATS)[number];

export const DEV_PROCESSES = [
  "C-41",
  "B&W",
  "E-6",
  "ECN-2",
  "STAND_DEV",
] as const;
export type DevProcess = (typeof DEV_PROCESSES)[number];

export const ROLL_STATUSES = [
  "SHOOTING",
  "DEVELOPED",
  "SCANNED",
  "ARCHIVED",
] as const;
export type RollStatus = (typeof ROLL_STATUSES)[number];

export const MAX_FRAMES_BY_FORMAT: Record<LogbookFormat, number> = {
  "135": 39,
  "120_645": 16,
  "120_66": 12,
  "120_67": 10,
  "4x5": 1,
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw AppError.badRequest("MSG002: Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function pick(body: Record<string, unknown>, camel: string, snake?: string): unknown {
  if (body[camel] !== undefined) return body[camel];
  if (snake && body[snake] !== undefined) return body[snake];
  return undefined;
}

function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw AppError.badRequest(`MSG002: ${field} must be a valid UUID`);
  }
  return value;
}

function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw AppError.badRequest(`MSG002: ${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) {
    throw AppError.badRequest(`MSG002: ${field} must be at most ${max} characters`);
  }
  return trimmed;
}

function requiredEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw AppError.badRequest(
      `MSG002: ${field} must be one of: ${allowed.join(", ")}`,
    );
  }
  return value as T;
}

function requiredIso(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 6 || value > 25600) {
    throw AppError.badRequest(
      `MSG002: ${field} must be an integer between 6 and 25600`,
    );
  }
  return value;
}

function requiredDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw AppError.badRequest(`MSG002: ${field} must be a valid YYYY-MM-DD date`);
  }
  return value;
}

function optionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requiredDate(value, field);
}

export function getMaxFramesForFormat(format: string): number {
  return MAX_FRAMES_BY_FORMAT[format as LogbookFormat] ?? 39;
}

export function formatPushPullEv(isoRated: number, isoShot: number): string {
  if (isoRated <= 0 || isoShot <= 0 || isoRated === isoShot) {
    return "0 EV (Box Speed)";
  }
  const ev = Math.log2(isoShot / isoRated);
  const rounded = Math.round(ev * 10) / 10;
  if (rounded > 0) {
    return `+${rounded} EV (Push ${rounded} stop${rounded === 1 ? "" : "s"})`;
  }
  const abs = Math.abs(rounded);
  return `${rounded} EV (Pull ${abs} stop${abs === 1 ? "" : "s"})`;
}

export function validateRollStatusTransition(
  current: RollStatus,
  next: RollStatus,
  ctx: { loggedFramesCount: number; devDate: string | null },
) {
  if (current === next) return;
  const order: Record<RollStatus, number> = {
    SHOOTING: 0,
    DEVELOPED: 1,
    SCANNED: 2,
    ARCHIVED: 3,
  };
  if (order[next] !== order[current] + 1) {
    throw AppError.badRequest(
      `MSG002: Invalid film roll status transition from ${current} to ${next}`,
    );
  }
  if (next === "DEVELOPED") {
    if (ctx.loggedFramesCount < 1) {
      throw AppError.badRequest(
        "MSG002: Film roll must have at least 1 logged frame before marking DEVELOPED",
      );
    }
    if (!ctx.devDate) {
      throw AppError.badRequest(
        "MSG002: devDate is required when marking film roll as DEVELOPED",
      );
    }
  }
}

export interface ValidatedFilmRoll {
  filmStockId: string | null;
  customFilmName: string | null;
  format: LogbookFormat;
  isoRated: number;
  isoShot: number;
  cameraId: string | null;
  customCameraName: string | null;
  labId: string | null;
  customLabName: string | null;
  devProcess: DevProcess;
  loadDate: string;
  devDate: string | null;
  notes: string | null;
}

export function validateFilmRollInput(raw: unknown): ValidatedFilmRoll {
  const body = asObject(raw);
  const filmStockId = optionalUuid(
    pick(body, "filmStockId", "film_stock_id"),
    "filmStockId",
  );
  const customFilmName = optionalText(
    pick(body, "customFilmName", "custom_film_name"),
    "customFilmName",
    150,
  );
  if (!filmStockId && !customFilmName) {
    throw AppError.badRequest(
      "MSG002: Either filmStockId or customFilmName is required",
    );
  }

  const format = requiredEnum(body.format, "format", LOGBOOK_FORMATS);
  const isoRated = requiredIso(
    pick(body, "isoRated", "iso_rated"),
    "isoRated",
  );
  const rawIsoShot = pick(body, "isoShot", "iso_shot");
  const isoShot =
    rawIsoShot === undefined ? isoRated : requiredIso(rawIsoShot, "isoShot");

  const cameraId = optionalUuid(pick(body, "cameraId", "camera_id"), "cameraId");
  const customCameraName = optionalText(
    pick(body, "customCameraName", "custom_camera_name"),
    "customCameraName",
    150,
  );
  const labId = optionalUuid(pick(body, "labId", "lab_id"), "labId");
  const customLabName = optionalText(
    pick(body, "customLabName", "custom_lab_name"),
    "customLabName",
    150,
  );

  const rawProcess = pick(body, "devProcess", "dev_process");
  const devProcess =
    rawProcess === undefined
      ? "C-41"
      : requiredEnum(rawProcess, "devProcess", DEV_PROCESSES);

  const loadDate = requiredDate(
    pick(body, "loadDate", "load_date"),
    "loadDate",
  );
  const devDate = optionalDate(pick(body, "devDate", "dev_date"), "devDate");
  const notes = optionalText(body.notes, "notes", 2000);

  return {
    filmStockId,
    customFilmName,
    format,
    isoRated,
    isoShot,
    cameraId,
    customCameraName,
    labId,
    customLabName,
    devProcess,
    loadDate,
    devDate,
    notes,
  };
}

export interface ValidatedFrameLog {
  frameNumber: number;
  lensId: string | null;
  customLensName: string | null;
  focalLengthMm: number | null;
  aperture: string | null;
  shutterSpeed: string | null;
  exposureCompensation: string | null;
  filterUsed: string | null;
  locationName: string | null;
  latitude: string | null;
  longitude: string | null;
  shotAt: Date | null;
  scannedImageAssetId: string | null;
  notes: string | null;
}

export function validateFrameLogInput(
  raw: unknown,
  rollFormat: string,
): ValidatedFrameLog {
  const body = asObject(raw);
  const frameNumber = pick(body, "frameNumber", "frame_number");
  if (
    typeof frameNumber !== "number" ||
    !Number.isInteger(frameNumber) ||
    frameNumber <= 0
  ) {
    throw AppError.badRequest(
      "MSG002: frameNumber must be a positive integer",
    );
  }

  const maxFrames = getMaxFramesForFormat(rollFormat);
  if (frameNumber > maxFrames) {
    throw new AppError(
      `MSG010: Frame number (${frameNumber}) exceeds physical limit of ${maxFrames} frames for format ${rollFormat}`,
      422,
    );
  }

  const lensId = optionalUuid(pick(body, "lensId", "lens_id"), "lensId");
  const customLensName = optionalText(
    pick(body, "customLensName", "custom_lens_name"),
    "customLensName",
    150,
  );

  const rawFocal = pick(body, "focalLengthMm", "focal_length_mm");
  let focalLengthMm: number | null = null;
  if (rawFocal !== undefined && rawFocal !== null) {
    if (
      typeof rawFocal !== "number" ||
      !Number.isInteger(rawFocal) ||
      rawFocal < 4 ||
      rawFocal > 2000
    ) {
      throw AppError.badRequest(
        "MSG002: focalLengthMm must be an integer between 4 and 2000",
      );
    }
    focalLengthMm = rawFocal;
  }

  const aperture = optionalText(body.aperture, "aperture", 15);
  const shutterSpeed = optionalText(
    pick(body, "shutterSpeed", "shutter_speed"),
    "shutterSpeed",
    20,
  );
  const exposureCompensation = optionalText(
    pick(body, "exposureCompensation", "exposure_compensation"),
    "exposureCompensation",
    10,
  );
  const filterUsed = optionalText(
    pick(body, "filterUsed", "filter_used"),
    "filterUsed",
    50,
  );
  const locationName = optionalText(
    pick(body, "locationName", "location_name"),
    "locationName",
    255,
  );

  const rawLat = body.latitude;
  let latitude: string | null = null;
  if (rawLat !== undefined && rawLat !== null) {
    if (typeof rawLat !== "number" || !Number.isFinite(rawLat) || rawLat < -90 || rawLat > 90) {
      throw AppError.badRequest("MSG002: latitude must be between -90 and 90");
    }
    latitude = rawLat.toFixed(7);
  }

  const rawLng = body.longitude;
  let longitude: string | null = null;
  if (rawLng !== undefined && rawLng !== null) {
    if (typeof rawLng !== "number" || !Number.isFinite(rawLng) || rawLng < -180 || rawLng > 180) {
      throw AppError.badRequest("MSG002: longitude must be between -180 and 180");
    }
    longitude = rawLng.toFixed(7);
  }

  const rawShotAt = pick(body, "shotAt", "shot_at");
  let shotAt: Date | null = null;
  if (rawShotAt !== undefined && rawShotAt !== null && rawShotAt !== "") {
    if (typeof rawShotAt !== "string" || Number.isNaN(Date.parse(rawShotAt))) {
      throw AppError.badRequest("MSG002: shotAt must be a valid ISO timestamp");
    }
    shotAt = new Date(rawShotAt);
  }

  const scannedImageAssetId = optionalUuid(
    pick(body, "scannedImageAssetId", "scanned_image_asset_id"),
    "scannedImageAssetId",
  );
  const notes = optionalText(body.notes, "notes", 2000);

  return {
    frameNumber,
    lensId,
    customLensName,
    focalLengthMm,
    aperture,
    shutterSpeed,
    exposureCompensation,
    filterUsed,
    locationName,
    latitude,
    longitude,
    shotAt,
    scannedImageAssetId,
    notes,
  };
}
