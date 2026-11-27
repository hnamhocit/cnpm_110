import { AppError } from "../utils/errors";

export const FILM_PROCESSES = ["C-41", "B&W", "E-6", "ECN-2"] as const;
export type FilmProcess = (typeof FILM_PROCESSES)[number];

export const FILM_COLOR_TYPES = [
  "COLOR_NEGATIVE",
  "BLACK_AND_WHITE",
  "COLOR_SLIDE_POSITIVE",
  "MOTION_PICTURE_COLOR",
] as const;
export type FilmColorType = (typeof FILM_COLOR_TYPES)[number];

export const FILM_FORMATS = [
  "135",
  "120",
  "4x5",
  "8x10",
  "110",
  "HALF_FRAME",
] as const;
export type FilmFormat = (typeof FILM_FORMATS)[number];

export const MASTER_DATA_STATUSES = ["DRAFT", "ACTIVE", "DEPRECATED"] as const;
export type MasterDataStatus = (typeof MASTER_DATA_STATUSES)[number];

export const CAMERA_TYPES = [
  "SLR",
  "RANGEFINDER",
  "TLR",
  "POINT_AND_SHOOT",
  "MEDIUM_FORMAT_SLR",
  "MEDIUM_FORMAT_RANGEFINDER",
  "LARGE_FORMAT",
  "PINHOLE",
  "OTHER",
] as const;
export type CameraType = (typeof CAMERA_TYPES)[number];

export const SHUTTER_MECHANISMS = [
  "MECHANICAL",
  "ELECTRONIC",
  "HYBRID",
] as const;
export type ShutterMechanism = (typeof SHUTTER_MECHANISMS)[number];

export const LAB_SCANNERS = [
  "NORITSU_HS1800",
  "FUJI_FRONTIER_SP3000",
  "HASSELBLAD_FLEXTIGHT_X5",
  "DSLR_SCAN",
  "EPSON_V850",
  "OTHER",
] as const;
export type LabScanner = (typeof LAB_SCANNERS)[number];

const DANGEROUS_CHARS = /[<>{}]/;

function slugToken(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCode(prefix: string, parts: Array<string | number>, maxLen = 50): string {
  const joined = [prefix, ...parts.map((p) => slugToken(String(p)))]
    .filter(Boolean)
    .join("-");
  return joined.slice(0, maxLen).replace(/-+$/, "");
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw AppError.badRequest("MSG002: Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function pick(body: Record<string, unknown>, snake: string, camel?: string): unknown {
  if (body[snake] !== undefined) return body[snake];
  if (camel && body[camel] !== undefined) return body[camel];
  return undefined;
}

function requiredText(
  value: unknown,
  field: string,
  min: number,
  max: number,
  rejectDangerous = true,
): string {
  if (typeof value !== "string") {
    throw AppError.badRequest(`MSG002: ${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw AppError.badRequest(
      `MSG002: ${field} must be between ${min} and ${max} characters`,
    );
  }
  if (rejectDangerous && DANGEROUS_CHARS.test(trimmed)) {
    throw AppError.badRequest(`MSG002: ${field} contains invalid characters`);
  }
  return trimmed;
}

function optionalText(
  value: unknown,
  field: string,
  max: number,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw AppError.badRequest(`MSG002: ${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
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

function requiredEnumArray<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw AppError.badRequest(`MSG002: ${field} must be a non-empty array`);
  }
  const unique: T[] = [];
  for (const item of value) {
    const valid = requiredEnum(item, field, allowed);
    if (!unique.includes(valid)) unique.push(valid);
  }
  return unique;
}

function optionalBoolean(value: unknown, field: string, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") {
    throw AppError.badRequest(`MSG002: ${field} must be a boolean`);
  }
  return value;
}

function requiredIntInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw AppError.badRequest(
      `MSG002: ${field} must be an integer between ${min} and ${max}`,
    );
  }
  return value;
}

function requiredNumberInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw AppError.badRequest(
      `MSG002: ${field} must be a number between ${min} and ${max}`,
    );
  }
  return value;
}

export interface ValidatedFilmStock {
  code: string;
  brand: string;
  name: string;
  nominalIso: number;
  process: FilmProcess;
  colorType: FilmColorType;
  supportedFormats: FilmFormat[];
  isDxCoded: boolean;
  description: string | null;
  status: MasterDataStatus;
}

export function validateFilmStockInput(raw: unknown): ValidatedFilmStock {
  const body = asObject(raw);
  const brand = requiredText(body.brand, "brand", 2, 100);
  const name = requiredText(body.name, "name", 2, 150);
  const nominalIso = requiredIntInRange(
    pick(body, "nominal_iso", "nominalIso"),
    "nominal_iso",
    6,
    12800,
  );
  const process = requiredEnum(body.process, "process", FILM_PROCESSES);
  const colorType = requiredEnum(
    pick(body, "color_type", "colorType"),
    "color_type",
    FILM_COLOR_TYPES,
  );

  if (process === "ECN-2" && colorType !== "MOTION_PICTURE_COLOR") {
    throw new AppError(
      "ERR_PROCESS_MISMATCH: Process ECN-2 requires color_type MOTION_PICTURE_COLOR",
      422,
    );
  }
  if (process === "B&W" && colorType !== "BLACK_AND_WHITE") {
    throw new AppError(
      "ERR_PROCESS_MISMATCH: Process B&W requires color_type BLACK_AND_WHITE",
      422,
    );
  }

  const rawFormats = pick(body, "supported_formats", "supportedFormats");
  const supportedFormats =
    rawFormats === undefined
      ? (["135"] as FilmFormat[])
      : requiredEnumArray(rawFormats, "supported_formats", FILM_FORMATS);

  const isDxCoded = optionalBoolean(
    pick(body, "is_dx_coded", "isDxCoded"),
    "is_dx_coded",
    true,
  );
  const description = optionalText(body.description, "description", 2000) ?? null;
  const status =
    body.status === undefined
      ? "ACTIVE"
      : requiredEnum(body.status, "status", MASTER_DATA_STATUSES);

  const customCode = optionalText(body.code, "code", 50);
  const code = customCode || buildCode("FILM", [brand, name, nominalIso]);

  return {
    code,
    brand,
    name,
    nominalIso,
    process,
    colorType,
    supportedFormats,
    isDxCoded,
    description,
    status,
  };
}

export interface ValidatedCamera {
  code: string;
  brand: string;
  model: string;
  cameraType: CameraType;
  supportedFormat: FilmFormat;
  defaultLensMount: string | null;
  hasFixedLens: boolean;
  fixedLensSpecs: string | null;
  shutterMechanism: ShutterMechanism;
  productionStartYear: number | null;
  productionEndYear: number | null;
  status: MasterDataStatus;
}

export function validateCameraInput(raw: unknown): ValidatedCamera {
  const body = asObject(raw);
  const brand = requiredText(body.brand, "brand", 2, 100);
  const model = requiredText(body.model, "model", 2, 150);
  const cameraType = requiredEnum(
    pick(body, "camera_type", "cameraType"),
    "camera_type",
    CAMERA_TYPES,
  );
  const rawFormat = pick(body, "supported_format", "supportedFormat");
  const supportedFormat =
    rawFormat === undefined
      ? "135"
      : requiredEnum(rawFormat, "supported_format", FILM_FORMATS);

  const hasFixedLens = optionalBoolean(
    pick(body, "has_fixed_lens", "hasFixedLens"),
    "has_fixed_lens",
    false,
  );
  let defaultLensMount =
    optionalText(
      pick(body, "default_lens_mount", "defaultLensMount"),
      "default_lens_mount",
      50,
    ) ?? null;
  const fixedLensSpecs =
    optionalText(
      pick(body, "fixed_lens_specs", "fixedLensSpecs"),
      "fixed_lens_specs",
      150,
    ) ?? null;

  if (hasFixedLens) {
    if (!fixedLensSpecs || fixedLensSpecs.length < 5) {
      throw AppError.badRequest(
        "MSG002: fixed_lens_specs (min 5 chars) is required when has_fixed_lens is true",
      );
    }
    defaultLensMount = "Fixed";
  }

  const rawShutter = pick(body, "shutter_mechanism", "shutterMechanism");
  const shutterMechanism =
    rawShutter === undefined
      ? "MECHANICAL"
      : requiredEnum(rawShutter, "shutter_mechanism", SHUTTER_MECHANISMS);

  const maxYear = new Date().getUTCFullYear() + 1;
  const rawStart = pick(body, "production_start_year", "productionStartYear");
  const rawEnd = pick(body, "production_end_year", "productionEndYear");
  const productionStartYear =
    rawStart === undefined || rawStart === null
      ? null
      : requiredIntInRange(rawStart, "production_start_year", 1850, maxYear);
  const productionEndYear =
    rawEnd === undefined || rawEnd === null
      ? null
      : requiredIntInRange(rawEnd, "production_end_year", 1850, maxYear);

  if (
    productionStartYear !== null &&
    productionEndYear !== null &&
    productionEndYear < productionStartYear
  ) {
    throw AppError.badRequest(
      "MSG002: production_end_year cannot be earlier than production_start_year",
    );
  }

  const status =
    body.status === undefined
      ? "ACTIVE"
      : requiredEnum(body.status, "status", MASTER_DATA_STATUSES);

  const customCode = optionalText(body.code, "code", 50);
  const code = customCode || buildCode("CAM", [brand, model]);

  return {
    code,
    brand,
    model,
    cameraType,
    supportedFormat,
    defaultLensMount,
    hasFixedLens,
    fixedLensSpecs,
    shutterMechanism,
    productionStartYear,
    productionEndYear,
    status,
  };
}

export interface ValidatedLens {
  code: string;
  brand: string;
  model: string;
  mountType: string;
  focalLengthMinMm: string;
  focalLengthMaxMm: string | null;
  isPrime: boolean;
  maxAperture: string;
  minAperture: string | null;
  formatCoverage: FilmFormat[];
  status: MasterDataStatus;
}

export function validateLensInput(raw: unknown): ValidatedLens {
  const body = asObject(raw);
  const brand = requiredText(body.brand, "brand", 2, 100);
  const model = requiredText(body.model, "model", 2, 150);
  const mountType = requiredText(
    pick(body, "mount_type", "mountType"),
    "mount_type",
    2,
    50,
  );
  const isPrime = optionalBoolean(
    pick(body, "is_prime", "isPrime"),
    "is_prime",
    true,
  );
  const focalMin = requiredNumberInRange(
    pick(body, "focal_length_min_mm", "focalLengthMinMm"),
    "focal_length_min_mm",
    4.0,
    2000.0,
  );
  const rawFocalMax = pick(body, "focal_length_max_mm", "focalLengthMaxMm");
  let focalMax: number | null = null;
  if (rawFocalMax !== undefined && rawFocalMax !== null) {
    focalMax = requiredNumberInRange(rawFocalMax, "focal_length_max_mm", 4.0, 2000.0);
  }

  if (isPrime) {
    if (focalMax !== null && focalMax !== focalMin) {
      throw AppError.badRequest(
        "MSG002: focal_length_max_mm must be null or equal to focal_length_min_mm for prime lenses",
      );
    }
    focalMax = null;
  } else {
    if (focalMax === null || focalMax <= focalMin) {
      throw AppError.badRequest(
        "MSG002: zoom lenses require focal_length_max_mm greater than focal_length_min_mm",
      );
    }
  }

  const maxAperture = requiredNumberInRange(
    pick(body, "max_aperture", "maxAperture"),
    "max_aperture",
    0.7,
    32.0,
  );
  const rawMinAperture = pick(body, "min_aperture", "minAperture");
  let minAperture: number | null = null;
  if (rawMinAperture !== undefined && rawMinAperture !== null) {
    minAperture = requiredNumberInRange(rawMinAperture, "min_aperture", 0.7, 64.0);
    if (minAperture <= maxAperture) {
      throw AppError.badRequest(
        "MSG002: min_aperture must be greater (smaller opening) than max_aperture",
      );
    }
  }

  const rawCoverage = pick(body, "format_coverage", "formatCoverage");
  const formatCoverage =
    rawCoverage === undefined
      ? (["135"] as FilmFormat[])
      : requiredEnumArray(rawCoverage, "format_coverage", FILM_FORMATS);

  const status =
    body.status === undefined
      ? "ACTIVE"
      : requiredEnum(body.status, "status", MASTER_DATA_STATUSES);

  const customCode = optionalText(body.code, "code", 50);
  const code = customCode || buildCode("LENS", [brand, model]);

  return {
    code,
    brand,
    model,
    mountType,
    focalLengthMinMm: focalMin.toFixed(2),
    focalLengthMaxMm: focalMax === null ? null : focalMax.toFixed(2),
    isPrime,
    maxAperture: maxAperture.toFixed(1),
    minAperture: minAperture === null ? null : minAperture.toFixed(1),
    formatCoverage,
    status,
  };
}

export interface ValidatedFilmLab {
  code: string;
  name: string;
  countryCode: string;
  city: string;
  address: string | null;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  supportedProcesses: FilmProcess[];
  scanners: LabScanner[];
  isVerifiedPartner: boolean;
  status: MasterDataStatus;
}

export function validateFilmLabInput(raw: unknown): ValidatedFilmLab {
  const body = asObject(raw);
  const name = requiredText(body.name, "name", 2, 150);
  const rawCountry = pick(body, "country_code", "countryCode");
  if (typeof rawCountry !== "string" || !/^[A-Z]{2}$/.test(rawCountry.trim())) {
    throw AppError.badRequest(
      "MSG002: country_code must be a 2-letter uppercase ISO 3166-1 alpha-2 code",
    );
  }
  const countryCode = rawCountry.trim();
  const city = requiredText(body.city, "city", 2, 100);
  const address = optionalText(body.address, "address", 500) ?? null;
  const websiteUrl =
    optionalText(pick(body, "website_url", "websiteUrl"), "website_url", 255) ??
    null;
  const email = optionalText(body.email, "email", 150) ?? null;
  const phone = optionalText(body.phone, "phone", 30) ?? null;

  const supportedProcesses = requiredEnumArray(
    pick(body, "supported_processes", "supportedProcesses"),
    "supported_processes",
    FILM_PROCESSES,
  );
  const scanners = requiredEnumArray(body.scanners, "scanners", LAB_SCANNERS);
  const isVerifiedPartner = optionalBoolean(
    pick(body, "is_verified_partner", "isVerifiedPartner"),
    "is_verified_partner",
    false,
  );
  const status =
    body.status === undefined
      ? "ACTIVE"
      : requiredEnum(body.status, "status", MASTER_DATA_STATUSES);

  const customCode = optionalText(body.code, "code", 50);
  const code = customCode || buildCode("LAB", [countryCode, name, city]);

  return {
    code,
    name,
    countryCode,
    city,
    address,
    websiteUrl,
    email,
    phone,
    supportedProcesses,
    scanners,
    isVerifiedPartner,
    status,
  };
}
