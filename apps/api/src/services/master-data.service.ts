import {
  and,
  asc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../db";
import {
  cameras,
  filmLabs,
  filmStocks,
  lenses,
} from "../db/schemas/module-2.schema";
import { AppError } from "../utils/errors";
import {
  validateCameraInput,
  validateFilmLabInput,
  validateFilmStockInput,
  validateLensInput,
  type MasterDataStatus,
} from "./master-data.validation";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ListQueryOptions {
  search?: string;
  brand?: string;
  process?: string;
  format?: string;
  cameraType?: string;
  mountType?: string;
  isPrime?: boolean;
  countryCode?: string;
  city?: string;
  scanner?: string;
  verifiedOnly?: boolean;
  status?: "ACTIVE" | "DRAFT" | "DEPRECATED" | "ALL";
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const record = err as { code?: string; cause?: { code?: string } };
  return record.code === "23505" || record.cause?.code === "23505";
}

function parsePagination(page?: number, limit?: number) {
  const safePage = Number.isInteger(page) && (page ?? 0) > 0 ? (page as number) : 1;
  const rawLimit = Number.isInteger(limit) && (limit ?? 0) > 0 ? (limit as number) : 50;
  const safeLimit = Math.min(rawLimit, 200);
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

function buildStatusAndDeletedConditions(
  statusCol: unknown,
  isDeletedCol: unknown,
  opts: ListQueryOptions,
  conditions: SQL[],
) {
  if (!opts.includeDeleted) {
    conditions.push(eq(isDeletedCol as typeof filmStocks.isDeleted, false));
  }
  const targetStatus = opts.status ?? "ACTIVE";
  if (targetStatus !== "ALL") {
    conditions.push(eq(statusCol as typeof filmStocks.status, targetStatus));
  }
}

export async function listFilmStocks(opts: ListQueryOptions) {
  const { page, limit, offset } = parsePagination(opts.page, opts.limit);
  const conditions: SQL[] = [];
  buildStatusAndDeletedConditions(
    filmStocks.status,
    filmStocks.isDeleted,
    opts,
    conditions,
  );

  if (opts.search) {
    const term = `%${opts.search.trim()}%`;
    conditions.push(or(ilike(filmStocks.brand, term), ilike(filmStocks.name, term))!);
  }
  if (opts.brand) {
    conditions.push(ilike(filmStocks.brand, opts.brand.trim()));
  }
  if (opts.process) {
    conditions.push(eq(filmStocks.process, opts.process.trim()));
  }
  if (opts.format) {
    conditions.push(
      sql`${opts.format.trim()} = ANY(${filmStocks.supportedFormats})`,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(filmStocks)
      .where(where)
      .orderBy(asc(filmStocks.brand), asc(filmStocks.name), asc(filmStocks.nominalIso))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(filmStocks)
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    } satisfies PaginationMeta,
  };
}

export async function getFilmStockById(id: string) {
  const [row] = await db.select().from(filmStocks).where(eq(filmStocks.id, id));
  if (!row) throw AppError.notFound("MSG001: Film stock not found");
  return row;
}

export async function createFilmStock(raw: unknown, actorId: string) {
  const input = validateFilmStockInput(raw);
  try {
    const [created] = await db
      .insert(filmStocks)
      .values({
        ...input,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    return created;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: Film stock with this brand, name, and ISO already exists",
      );
    }
    throw err;
  }
}

export async function updateFilmStock(id: string, raw: unknown, actorId: string) {
  const existing = await getFilmStockById(id);
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = {
    code: body.code ?? existing.code,
    brand: body.brand ?? existing.brand,
    name: body.name ?? existing.name,
    nominal_iso: body.nominal_iso ?? body.nominalIso ?? existing.nominalIso,
    process: body.process ?? existing.process,
    color_type: body.color_type ?? body.colorType ?? existing.colorType,
    supported_formats:
      body.supported_formats ?? body.supportedFormats ?? existing.supportedFormats,
    is_dx_coded: body.is_dx_coded ?? body.isDxCoded ?? existing.isDxCoded,
    description: body.description !== undefined ? body.description : existing.description,
    status: body.status ?? existing.status,
  };
  const input = validateFilmStockInput(merged);

  try {
    const [updated] = await db
      .update(filmStocks)
      .set({
        ...input,
        updatedBy: actorId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(and(eq(filmStocks.id, id), eq(filmStocks.version, existing.version)))
      .returning();

    if (!updated) {
      throw AppError.conflict("Version conflict while updating film stock");
    }
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: Film stock with this brand, name, and ISO already exists",
      );
    }
    throw err;
  }
}

export async function softDeleteFilmStock(id: string, actorId: string) {
  const existing = await getFilmStockById(id);
  if (existing.isDeleted) return existing;

  const [deleted] = await db
    .update(filmStocks)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      status: "DEPRECATED" satisfies MasterDataStatus,
      updatedBy: actorId,
      updatedAt: new Date(),
      version: existing.version + 1,
    })
    .where(eq(filmStocks.id, id))
    .returning();
  return deleted;
}

export async function restoreFilmStock(id: string, actorId: string) {
  const existing = await getFilmStockById(id);
  try {
    const [restored] = await db
      .update(filmStocks)
      .set({
        isDeleted: false,
        deletedAt: null,
        status: "ACTIVE" satisfies MasterDataStatus,
        updatedBy: actorId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(eq(filmStocks.id, id))
      .returning();
    return restored;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: An active film stock with the same brand, name, and ISO already exists",
      );
    }
    throw err;
  }
}

export async function listCameras(opts: ListQueryOptions) {
  const { page, limit, offset } = parsePagination(opts.page, opts.limit);
  const conditions: SQL[] = [];
  buildStatusAndDeletedConditions(cameras.status, cameras.isDeleted, opts, conditions);

  if (opts.search) {
    const term = `%${opts.search.trim()}%`;
    conditions.push(or(ilike(cameras.brand, term), ilike(cameras.model, term))!);
  }
  if (opts.brand) {
    conditions.push(ilike(cameras.brand, opts.brand.trim()));
  }
  if (opts.cameraType) {
    conditions.push(eq(cameras.cameraType, opts.cameraType.trim()));
  }
  if (opts.format) {
    conditions.push(eq(cameras.supportedFormat, opts.format.trim()));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(cameras)
      .where(where)
      .orderBy(asc(cameras.brand), asc(cameras.model))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cameras)
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    } satisfies PaginationMeta,
  };
}

export async function getCameraById(id: string) {
  const [row] = await db.select().from(cameras).where(eq(cameras.id, id));
  if (!row) throw AppError.notFound("MSG001: Camera not found");
  return row;
}

export async function createCamera(raw: unknown, actorId: string) {
  const input = validateCameraInput(raw);
  try {
    const [created] = await db
      .insert(cameras)
      .values({
        ...input,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    return created;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: Camera with this brand and model already exists",
      );
    }
    throw err;
  }
}

export async function updateCamera(id: string, raw: unknown, actorId: string) {
  const existing = await getCameraById(id);
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = {
    code: body.code ?? existing.code,
    brand: body.brand ?? existing.brand,
    model: body.model ?? existing.model,
    camera_type: body.camera_type ?? body.cameraType ?? existing.cameraType,
    supported_format:
      body.supported_format ?? body.supportedFormat ?? existing.supportedFormat,
    default_lens_mount:
      body.default_lens_mount !== undefined
        ? body.default_lens_mount
        : body.defaultLensMount !== undefined
          ? body.defaultLensMount
          : existing.defaultLensMount,
    has_fixed_lens:
      body.has_fixed_lens ?? body.hasFixedLens ?? existing.hasFixedLens,
    fixed_lens_specs:
      body.fixed_lens_specs !== undefined
        ? body.fixed_lens_specs
        : body.fixedLensSpecs !== undefined
          ? body.fixedLensSpecs
          : existing.fixedLensSpecs,
    shutter_mechanism:
      body.shutter_mechanism ?? body.shutterMechanism ?? existing.shutterMechanism,
    production_start_year:
      body.production_start_year !== undefined
        ? body.production_start_year
        : body.productionStartYear !== undefined
          ? body.productionStartYear
          : existing.productionStartYear,
    production_end_year:
      body.production_end_year !== undefined
        ? body.production_end_year
        : body.productionEndYear !== undefined
          ? body.productionEndYear
          : existing.productionEndYear,
    status: body.status ?? existing.status,
  };
  const input = validateCameraInput(merged);

  try {
    const [updated] = await db
      .update(cameras)
      .set({
        ...input,
        updatedBy: actorId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(and(eq(cameras.id, id), eq(cameras.version, existing.version)))
      .returning();

    if (!updated) {
      throw AppError.conflict("Version conflict while updating camera");
    }
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: Camera with this brand and model already exists",
      );
    }
    throw err;
  }
}

export async function softDeleteCamera(id: string, actorId: string) {
  const existing = await getCameraById(id);
  if (existing.isDeleted) return existing;

  const [deleted] = await db
    .update(cameras)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      status: "DEPRECATED" satisfies MasterDataStatus,
      updatedBy: actorId,
      updatedAt: new Date(),
      version: existing.version + 1,
    })
    .where(eq(cameras.id, id))
    .returning();
  return deleted;
}

export async function restoreCamera(id: string, actorId: string) {
  const existing = await getCameraById(id);
  try {
    const [restored] = await db
      .update(cameras)
      .set({
        isDeleted: false,
        deletedAt: null,
        status: "ACTIVE" satisfies MasterDataStatus,
        updatedBy: actorId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(eq(cameras.id, id))
      .returning();
    return restored;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: An active camera with the same brand and model already exists",
      );
    }
    throw err;
  }
}

export async function listLenses(opts: ListQueryOptions) {
  const { page, limit, offset } = parsePagination(opts.page, opts.limit);
  const conditions: SQL[] = [];
  buildStatusAndDeletedConditions(lenses.status, lenses.isDeleted, opts, conditions);

  if (opts.search) {
    const term = `%${opts.search.trim()}%`;
    conditions.push(or(ilike(lenses.brand, term), ilike(lenses.model, term))!);
  }
  if (opts.brand) {
    conditions.push(ilike(lenses.brand, opts.brand.trim()));
  }
  if (opts.mountType) {
    conditions.push(ilike(lenses.mountType, opts.mountType.trim()));
  }
  if (opts.isPrime !== undefined) {
    conditions.push(eq(lenses.isPrime, opts.isPrime));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(lenses)
      .where(where)
      .orderBy(asc(lenses.brand), asc(lenses.model))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(lenses)
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    } satisfies PaginationMeta,
  };
}

export async function getLensById(id: string) {
  const [row] = await db.select().from(lenses).where(eq(lenses.id, id));
  if (!row) throw AppError.notFound("MSG001: Lens not found");
  return row;
}

export async function createLens(raw: unknown, actorId: string) {
  const input = validateLensInput(raw);
  try {
    const [created] = await db
      .insert(lenses)
      .values({
        ...input,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    return created;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: Lens with this brand, model, and mount already exists",
      );
    }
    throw err;
  }
}

export async function updateLens(id: string, raw: unknown, actorId: string) {
  const existing = await getLensById(id);
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = {
    code: body.code ?? existing.code,
    brand: body.brand ?? existing.brand,
    model: body.model ?? existing.model,
    mount_type: body.mount_type ?? body.mountType ?? existing.mountType,
    focal_length_min_mm:
      body.focal_length_min_mm ??
      body.focalLengthMinMm ??
      Number(existing.focalLengthMinMm),
    focal_length_max_mm:
      body.focal_length_max_mm !== undefined
        ? body.focal_length_max_mm
        : body.focalLengthMaxMm !== undefined
          ? body.focalLengthMaxMm
          : existing.focalLengthMaxMm === null
            ? null
            : Number(existing.focalLengthMaxMm),
    is_prime: body.is_prime ?? body.isPrime ?? existing.isPrime,
    max_aperture:
      body.max_aperture ?? body.maxAperture ?? Number(existing.maxAperture),
    min_aperture:
      body.min_aperture !== undefined
        ? body.min_aperture
        : body.minAperture !== undefined
          ? body.minAperture
          : existing.minAperture === null
            ? null
            : Number(existing.minAperture),
    format_coverage:
      body.format_coverage ?? body.formatCoverage ?? existing.formatCoverage,
    status: body.status ?? existing.status,
  };
  const input = validateLensInput(merged);

  try {
    const [updated] = await db
      .update(lenses)
      .set({
        ...input,
        updatedBy: actorId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(and(eq(lenses.id, id), eq(lenses.version, existing.version)))
      .returning();

    if (!updated) {
      throw AppError.conflict("Version conflict while updating lens");
    }
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: Lens with this brand, model, and mount already exists",
      );
    }
    throw err;
  }
}

export async function softDeleteLens(id: string, actorId: string) {
  const existing = await getLensById(id);
  if (existing.isDeleted) return existing;

  const [deleted] = await db
    .update(lenses)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      status: "DEPRECATED" satisfies MasterDataStatus,
      updatedBy: actorId,
      updatedAt: new Date(),
      version: existing.version + 1,
    })
    .where(eq(lenses.id, id))
    .returning();
  return deleted;
}

export async function restoreLens(id: string, actorId: string) {
  const existing = await getLensById(id);
  try {
    const [restored] = await db
      .update(lenses)
      .set({
        isDeleted: false,
        deletedAt: null,
        status: "ACTIVE" satisfies MasterDataStatus,
        updatedBy: actorId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(eq(lenses.id, id))
      .returning();
    return restored;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: An active lens with the same brand, model, and mount already exists",
      );
    }
    throw err;
  }
}

export async function listFilmLabs(opts: ListQueryOptions) {
  const { page, limit, offset } = parsePagination(opts.page, opts.limit);
  const conditions: SQL[] = [];
  buildStatusAndDeletedConditions(
    filmLabs.status,
    filmLabs.isDeleted,
    opts,
    conditions,
  );

  if (opts.search) {
    const term = `%${opts.search.trim()}%`;
    conditions.push(or(ilike(filmLabs.name, term), ilike(filmLabs.city, term))!);
  }
  if (opts.countryCode) {
    conditions.push(eq(filmLabs.countryCode, opts.countryCode.trim().toUpperCase()));
  }
  if (opts.city) {
    conditions.push(ilike(filmLabs.city, opts.city.trim()));
  }
  if (opts.process) {
    conditions.push(
      sql`${opts.process.trim()} = ANY(${filmLabs.supportedProcesses})`,
    );
  }
  if (opts.scanner) {
    conditions.push(sql`${opts.scanner.trim()} = ANY(${filmLabs.scanners})`);
  }
  if (opts.verifiedOnly) {
    conditions.push(eq(filmLabs.isVerifiedPartner, true));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(filmLabs)
      .where(where)
      .orderBy(asc(filmLabs.countryCode), asc(filmLabs.name))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(filmLabs)
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    } satisfies PaginationMeta,
  };
}

export async function getFilmLabById(id: string) {
  const [row] = await db.select().from(filmLabs).where(eq(filmLabs.id, id));
  if (!row) throw AppError.notFound("MSG001: Film lab not found");
  return row;
}

export async function createFilmLab(raw: unknown, actorId: string) {
  const input = validateFilmLabInput(raw);
  try {
    const [created] = await db
      .insert(filmLabs)
      .values({
        ...input,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    return created;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: Film lab with this name, city, and country already exists",
      );
    }
    throw err;
  }
}

export async function updateFilmLab(id: string, raw: unknown, actorId: string) {
  const existing = await getFilmLabById(id);
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = {
    code: body.code ?? existing.code,
    name: body.name ?? existing.name,
    country_code:
      body.country_code ?? body.countryCode ?? existing.countryCode,
    city: body.city ?? existing.city,
    address: body.address !== undefined ? body.address : existing.address,
    website_url:
      body.website_url !== undefined
        ? body.website_url
        : body.websiteUrl !== undefined
          ? body.websiteUrl
          : existing.websiteUrl,
    email: body.email !== undefined ? body.email : existing.email,
    phone: body.phone !== undefined ? body.phone : existing.phone,
    supported_processes:
      body.supported_processes ??
      body.supportedProcesses ??
      existing.supportedProcesses,
    scanners: body.scanners ?? existing.scanners,
    is_verified_partner:
      body.is_verified_partner ??
      body.isVerifiedPartner ??
      existing.isVerifiedPartner,
    status: body.status ?? existing.status,
  };
  const input = validateFilmLabInput(merged);

  try {
    const [updated] = await db
      .update(filmLabs)
      .set({
        ...input,
        updatedBy: actorId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(and(eq(filmLabs.id, id), eq(filmLabs.version, existing.version)))
      .returning();

    if (!updated) {
      throw AppError.conflict("Version conflict while updating film lab");
    }
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: Film lab with this name, city, and country already exists",
      );
    }
    throw err;
  }
}

export async function softDeleteFilmLab(id: string, actorId: string) {
  const existing = await getFilmLabById(id);
  if (existing.isDeleted) return existing;

  const [deleted] = await db
    .update(filmLabs)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      status: "DEPRECATED" satisfies MasterDataStatus,
      updatedBy: actorId,
      updatedAt: new Date(),
      version: existing.version + 1,
    })
    .where(eq(filmLabs.id, id))
    .returning();
  return deleted;
}

export async function restoreFilmLab(id: string, actorId: string) {
  const existing = await getFilmLabById(id);
  try {
    const [restored] = await db
      .update(filmLabs)
      .set({
        isDeleted: false,
        deletedAt: null,
        status: "ACTIVE" satisfies MasterDataStatus,
        updatedBy: actorId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(eq(filmLabs.id, id))
      .returning();
    return restored;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict(
        "ERR_DUPLICATE_MASTER_DATA: An active film lab with the same name, city, and country already exists",
      );
    }
    throw err;
  }
}
