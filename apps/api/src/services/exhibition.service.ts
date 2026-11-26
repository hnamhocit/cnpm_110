import { and, desc, eq, inArray, sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "../db";
import {
  categories,
  contestPublications,
  contests,
  exhibitionImages,
  filmMetadata,
  submissionAiAnalyses,
  submissions,
  users,
  type OfficialResultEntry,
} from "../db/schema";
import { readFromStorage, uploadToR2 } from "../r2";
import { AppError } from "../utils/errors";

const PUBLISHED_CONTEST_STATUSES = ["results_published", "published", "archived"] as const;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildWatermarkSvg(width: number, height: number, copyrightText: string): Buffer {
  const safeText = escapeXml(copyrightText.slice(0, 90));
  const fontSize = Math.max(12, Math.min(26, Math.round(width * 0.022)));
  const paddingX = Math.round(fontSize * 0.9);
  const boxHeight = Math.min(height, Math.round(fontSize * 2.1));
  const estimatedTextWidth = Math.round(safeText.length * fontSize * 0.56) + paddingX * 2;
  const boxWidth = Math.min(width, Math.max(160, estimatedTextWidth));
  const margin = Math.min(16, Math.max(4, Math.floor(Math.min(width - boxWidth, height - boxHeight) / 2)));
  const boxX = Math.max(0, width - boxWidth - margin);
  const boxY = Math.max(0, height - boxHeight - margin);
  const textX = boxX + Math.floor(boxWidth / 2);
  const textY = boxY + Math.floor(boxHeight / 2) + Math.floor(fontSize * 0.35);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" rx="6" fill="rgba(15,23,42,0.68)"/>
    <text x="${textX}" y="${textY}" font-family="sans-serif" font-size="${fontSize}" font-weight="600" fill="rgba(255,255,255,0.92)" text-anchor="middle">${safeText}</text>
  </svg>`;

  return Buffer.from(svg);
}

/** BR-17: the public preview is resized, stripped of EXIF and watermarked before WebP encoding. */
async function generatePublicPreview(masterBuffer: Buffer, copyrightText: string): Promise<Buffer> {
  const resized = await sharp(masterBuffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  const watermark = buildWatermarkSvg(resized.info.width, resized.info.height, copyrightText);

  return sharp(resized.data)
    .composite([{ input: watermark, top: 0, left: 0 }])
    .webp({ quality: 82 })
    .toBuffer();
}

function exhibitionPreviewKey(masterKey: string, contestId: string, submissionId: string) {
  const fixturePrefix = masterKey.match(/^acceptance\/cinegen_acceptance_[a-z0-9_]+\//)?.[0] ?? "";
  return `${fixturePrefix}exhibitions/${contestId}/${submissionId}.webp`;
}

function buildCopyrightText(contestName: string, authorName: string, year: number): string {
  return `© ${year} ${contestName} — ${authorName}`;
}

function resolveContestYear(
  contest: { publishedAt: Date | null; startAt: Date | null; createdAt: Date },
  publicationPublishedAt?: Date | null,
): number {
  const ref = publicationPublishedAt ?? contest.publishedAt ?? contest.startAt ?? contest.createdAt;
  return ref.getUTCFullYear();
}

function assertContestPublished(
  contest: typeof contests.$inferSelect,
  publication: typeof contestPublications.$inferSelect | undefined,
) {
  const status = contest.status.toLowerCase();
  if (!PUBLISHED_CONTEST_STATUSES.includes(status as (typeof PUBLISHED_CONTEST_STATUSES)[number])) {
    throw AppError.conflict("Contest results must be published first");
  }
  if (status === "results_published" && !publication) {
    throw AppError.conflict("Official contest results snapshot is required");
  }
}

function proofRequiredFor(
  requireNegativeProof: boolean,
  submission: { proofRequestedAt: Date | null; negativeProofPath: string | null },
) {
  return Boolean(requireNegativeProof || submission.proofRequestedAt || submission.negativeProofPath);
}

function findOfficialEntry(
  entries: OfficialResultEntry[] | null | undefined,
  submissionId: string,
): OfficialResultEntry | undefined {
  return entries?.find((entry) => entry.submissionId === submissionId);
}

function publicVisibilityFilters() {
  return [
    eq(exhibitionImages.status, "PUBLISHED"),
    eq(exhibitionImages.isDeleted, false),
    eq(exhibitionImages.watermarkApplied, true),
    sql`${exhibitionImages.webpKey} IS NOT NULL`,
    eq(contests.isDeleted, false),
    sql`lower(${contests.status}) IN ('results_published', 'published', 'archived')`,
  ];
}

export interface ArchiveContestOptions {
  submissionIds?: string[];
  includeFinalists?: boolean;
  generateWebp?: boolean;
  applyWatermark?: boolean;
  publish?: boolean;
}

/**
 * UC-27 / BR-17: Organizer selects eligible works of a published contest for the digital archive.
 * Each selected work gets a watermarked, EXIF-free WebP preview while the master stays private.
 * Only works present in the official publication snapshot can be archived.
 */
export async function archiveContestWorks(
  contestId: string,
  ownerId: string,
  options: ArchiveContestOptions,
) {
  if (options.generateWebp === false || options.applyWatermark === false) {
    throw AppError.badRequest("WebP conversion and copyright watermark are required by BR-17");
  }

  const [contest] = await db
    .select()
    .from(contests)
    .where(and(eq(contests.id, contestId), eq(contests.isDeleted, false)))
    .limit(1);

  if (!contest) {
    throw AppError.notFound("Contest not found");
  }
  if (contest.createdBy !== ownerId) {
    throw AppError.forbidden("MSG005: You do not manage this contest");
  }

  const [publication] = await db
    .select()
    .from(contestPublications)
    .where(eq(contestPublications.contestId, contestId))
    .limit(1);

  assertContestPublished(contest, publication);

  const officialEntryMap = new Map((publication?.entries ?? []).map((entry) => [entry.submissionId, entry]));
  const requestedIds = options.submissionIds?.length ? [...new Set(options.submissionIds)] : null;

  let targetIds: string[];
  if (requestedIds) {
    targetIds = requestedIds;
  } else if (publication) {
    const includeFinalists = options.includeFinalists !== false;
    targetIds = publication.entries
      .filter((entry) => includeFinalists || entry.award !== null)
      .map((entry) => entry.submissionId);
  } else {
    const approved = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(eq(submissions.contestId, contestId), eq(submissions.status, "APPROVED")));
    targetIds = approved.map((row) => row.id);
  }

  if (targetIds.length === 0) {
    throw AppError.conflict("No eligible submissions found for exhibition archive");
  }
  const candidateRows = await assertEligibleSubmissions(contestId, targetIds, publication, officialEntryMap);
  const prepared = await prepareExhibitionPreviews(contest, contestId, candidateRows);

  return persistExhibitionItems(contestId, ownerId, prepared, options.publish !== false);
}

type ExhibitionCandidateRow = {
  submission: typeof submissions.$inferSelect;
  authorName: string;
  requireNegativeProof: boolean;
};

/** N27-03: rejects works that are not approved, not in the official snapshot, or missing a verified proof. */
async function assertEligibleSubmissions(
  contestId: string,
  targetIds: string[],
  publication: typeof contestPublications.$inferSelect | undefined,
  officialEntryMap: Map<string, OfficialResultEntry>,
): Promise<ExhibitionCandidateRow[]> {
  const candidateRows = await db
    .select({
      submission: submissions,
      authorName: users.fullName,
      requireNegativeProof: categories.requireNegativeProof,
    })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.participantId))
    .innerJoin(categories, eq(categories.id, submissions.categoryId))
    .where(inArray(submissions.id, targetIds));

  if (candidateRows.length !== targetIds.length) {
    throw AppError.notFound("One or more submissions were not found");
  }

  for (const { submission, requireNegativeProof } of candidateRows) {
    if (submission.contestId !== contestId) {
      throw AppError.conflict("Submission does not belong to this contest");
    }
    if (submission.status !== "APPROVED") {
      throw AppError.conflict("Only approved submissions can be archived for exhibition");
    }
    if (publication && !officialEntryMap.has(submission.id)) {
      throw AppError.conflict("Submission is not part of the published official results");
    }
    if (proofRequiredFor(requireNegativeProof, submission) && (!submission.negativeProofPath || !submission.proofVerifiedAt)) {
      throw AppError.conflict("BR-06: Required proof must be verified before archiving");
    }
  }

  return candidateRows;
}

type PreparedExhibitionItem = {
  submissionId: string;
  masterKey: string;
  webpKey: string;
  copyrightText: string;
};

/** N27-02: the master stays in the private bucket; only the processed WebP gets a public URL. */
async function prepareExhibitionPreviews(
  contest: typeof contests.$inferSelect,
  contestId: string,
  candidateRows: ExhibitionCandidateRow[],
): Promise<PreparedExhibitionItem[]> {
  const [publication] = await db
    .select({ publishedAt: contestPublications.publishedAt })
    .from(contestPublications)
    .where(eq(contestPublications.contestId, contestId))
    .limit(1);
  const year = resolveContestYear(contest, publication?.publishedAt);
  const prepared: PreparedExhibitionItem[] = [];

  for (const row of candidateRows) {
    const masterBuffer = await readFromStorage(row.submission.imageOriginalPath);
    if (!masterBuffer) {
      throw AppError.notFound("Master image not found");
    }

    const copyrightText = buildCopyrightText(contest.name, row.authorName, year);
    let previewBuffer: Buffer;
    try {
      previewBuffer = await generatePublicPreview(masterBuffer, copyrightText);
    } catch {
      throw new AppError("Failed to process exhibition preview image", 500);
    }

    const webpKey = exhibitionPreviewKey(row.submission.imageOriginalPath, contestId, row.submission.id);
    await uploadToR2(
      new File([new Uint8Array(previewBuffer)], `${row.submission.id}.webp`, { type: "image/webp" }),
      webpKey,
    );

    prepared.push({
      submissionId: row.submission.id,
      masterKey: row.submission.imageOriginalPath,
      webpKey,
      copyrightText,
    });
  }

  return prepared;
}

async function persistExhibitionItems(
  contestId: string,
  ownerId: string,
  prepared: PreparedExhibitionItem[],
  publish: boolean,
) {
  const now = new Date();
  const nextStatus = publish ? "PUBLISHED" : "READY";

  const items = await db.transaction(async (tx) => {
    const saved: {
      exhibitionId: string;
      submissionId: string;
      contestId: string;
      status: string;
      watermarked: boolean;
      copyright: string;
      imageUrl: string | null;
      publishedAt: Date | null;
    }[] = [];

    for (const item of prepared) {
      const values = {
        contestId,
        masterKey: item.masterKey,
        webpKey: item.webpKey,
        watermarkApplied: true,
        copyrightText: item.copyrightText,
        status: nextStatus,
        errorMessage: null,
        publishedBy: publish ? ownerId : null,
        publishedAt: publish ? now : null,
        isDeleted: false,
        updatedAt: now,
      };
      const [row] = await tx
        .insert(exhibitionImages)
        .values({ ...values, submissionId: item.submissionId })
        .onConflictDoUpdate({ target: exhibitionImages.submissionId, set: values })
        .returning();

      saved.push({
        exhibitionId: row.id,
        submissionId: row.submissionId,
        contestId,
        status: row.status,
        watermarked: row.watermarkApplied,
        copyright: row.copyrightText ?? item.copyrightText,
        imageUrl: publish ? `/api/v1/exhibitions/${row.id}/image` : null,
        publishedAt: row.publishedAt,
      });
    }

    return saved;
  });

  return {
    contestId,
    archiveStatus: publish ? "PUBLISHED" : "READY",
    message: publish
      ? "MSG028: Digital archive and exhibition published successfully"
      : "Archive processing completed",
    items,
  };
}

function exhibitionItemDto(
  exhibition: typeof exhibitionImages.$inferSelect,
  title: string,
  author: string,
) {
  return {
    id: exhibition.id,
    submissionId: exhibition.submissionId,
    contestId: exhibition.contestId,
    title,
    author,
    status: exhibition.status,
    watermarked: exhibition.watermarkApplied,
    copyright: exhibition.copyrightText,
    imageUrl: exhibition.status === "PUBLISHED" ? `/api/v1/exhibitions/${exhibition.id}/image` : null,
    errorMessage: exhibition.errorMessage,
    publishedAt: exhibition.publishedAt,
    createdAt: exhibition.createdAt,
    updatedAt: exhibition.updatedAt,
  };
}

/** N27-01: Organizer reads back the exhibition list of a contest they own. */
export async function listContestExhibitions(contestId: string, ownerId: string) {
  const [contest] = await db
    .select({ id: contests.id, createdBy: contests.createdBy })
    .from(contests)
    .where(and(eq(contests.id, contestId), eq(contests.isDeleted, false)))
    .limit(1);

  if (!contest) throw AppError.notFound("Contest not found");
  if (contest.createdBy !== ownerId) {
    throw AppError.forbidden("MSG005: You do not manage this contest");
  }

  const rows = await db
    .select({
      exhibition: exhibitionImages,
      title: submissions.title,
      author: users.fullName,
    })
    .from(exhibitionImages)
    .innerJoin(submissions, eq(submissions.id, exhibitionImages.submissionId))
    .innerJoin(users, eq(users.id, submissions.participantId))
    .where(and(eq(exhibitionImages.contestId, contestId), eq(exhibitionImages.isDeleted, false)))
    .orderBy(desc(exhibitionImages.updatedAt));

  return rows.map(({ exhibition, title, author }) => exhibitionItemDto(exhibition, title, author));
}

type OwnedExhibitionRow = {
  exhibition: typeof exhibitionImages.$inferSelect;
  contest: typeof contests.$inferSelect;
  submission: typeof submissions.$inferSelect;
  authorName: string;
  requireNegativeProof: boolean;
};

/** N27-04: only the Organizer who owns the contest can manage its exhibition items. */
async function ownedExhibition(exhibitionId: string, ownerId: string): Promise<OwnedExhibitionRow> {
  const [row] = await db
    .select({
      exhibition: exhibitionImages,
      contest: contests,
      submission: submissions,
      authorName: users.fullName,
      requireNegativeProof: categories.requireNegativeProof,
    })
    .from(exhibitionImages)
    .innerJoin(contests, eq(contests.id, exhibitionImages.contestId))
    .innerJoin(submissions, eq(submissions.id, exhibitionImages.submissionId))
    .innerJoin(users, eq(users.id, submissions.participantId))
    .innerJoin(categories, eq(categories.id, submissions.categoryId))
    .where(
      and(
        eq(exhibitionImages.id, exhibitionId),
        eq(exhibitionImages.isDeleted, false),
        eq(contests.isDeleted, false),
      ),
    )
    .limit(1);

  if (!row) {
    throw AppError.notFound("Exhibition image not found");
  }
  if (row.contest.createdBy !== ownerId) {
    throw AppError.forbidden("MSG005: You do not manage this contest");
  }
  return row;
}

/** The work must still be publishable: published contest, approved work, verified proof when required. */
async function assertEligibleForPublic(row: OwnedExhibitionRow) {
  const [publication] = await db
    .select()
    .from(contestPublications)
    .where(eq(contestPublications.contestId, row.contest.id))
    .limit(1);
  assertContestPublished(row.contest, publication);
  if (row.submission.status !== "APPROVED") {
    throw AppError.conflict("Only approved submissions can be published");
  }
  const proofRequired = proofRequiredFor(row.requireNegativeProof, row.submission);
  if (proofRequired && (!row.submission.negativeProofPath || !row.submission.proofVerifiedAt)) {
    throw AppError.conflict("BR-06: Required proof must be verified before publishing");
  }
}

/** Reprocesses the preview WebP for a single exhibition item (Organizer owner). */
export async function processExhibitionImage(
  exhibitionId: string,
  ownerId: string,
  options: { generateWebp?: boolean; applyWatermark?: boolean; publish?: boolean },
) {
  if (options.generateWebp === false || options.applyWatermark === false) {
    throw AppError.badRequest("WebP conversion and copyright watermark are required by BR-17");
  }

  const row = await ownedExhibition(exhibitionId, ownerId);
  await assertEligibleForPublic(row);

  const [publication] = await db
    .select({ publishedAt: contestPublications.publishedAt })
    .from(contestPublications)
    .where(eq(contestPublications.contestId, row.contest.id))
    .limit(1);

  const masterBuffer = await readFromStorage(row.exhibition.masterKey);
  if (!masterBuffer) {
    await db
      .update(exhibitionImages)
      .set({ status: "FAILED", errorMessage: "Master image not found", updatedAt: new Date() })
      .where(eq(exhibitionImages.id, exhibitionId));
    throw AppError.notFound("Master image not found");
  }

  const year = resolveContestYear(row.contest, publication?.publishedAt);
  const copyrightText = buildCopyrightText(row.contest.name, row.authorName, year);

  let previewBuffer: Buffer;
  try {
    previewBuffer = await generatePublicPreview(masterBuffer, copyrightText);
  } catch {
    await db
      .update(exhibitionImages)
      .set({ status: "FAILED", errorMessage: "Failed to process exhibition preview image", updatedAt: new Date() })
      .where(eq(exhibitionImages.id, exhibitionId));
    throw new AppError("Failed to process exhibition preview image", 500);
  }

  const webpKey = exhibitionPreviewKey(row.exhibition.masterKey, row.contest.id, row.submission.id);
  await uploadToR2(
    new File([new Uint8Array(previewBuffer)], `${row.submission.id}.webp`, { type: "image/webp" }),
    webpKey,
  );

  const publish = options.publish !== false;
  const now = new Date();
  const [updated] = await db
    .update(exhibitionImages)
    .set({
      webpKey,
      watermarkApplied: true,
      copyrightText,
      status: publish ? "PUBLISHED" : "READY",
      errorMessage: null,
      publishedBy: publish ? ownerId : row.exhibition.publishedBy,
      publishedAt: publish ? (row.exhibition.publishedAt ?? now) : row.exhibition.publishedAt,
      updatedAt: now,
    })
    .where(eq(exhibitionImages.id, exhibitionId))
    .returning();

  return {
    exhibitionId: updated.id,
    status: updated.status,
    watermarked: updated.watermarkApplied,
    copyright: updated.copyrightText,
    imageUrl: publish ? `/api/v1/exhibitions/${updated.id}/image` : null,
  };
}

export async function getExhibitionStatus(exhibitionId: string, ownerId: string) {
  const { exhibition } = await ownedExhibition(exhibitionId, ownerId);
  return {
    exhibitionId: exhibition.id,
    submissionId: exhibition.submissionId,
    contestId: exhibition.contestId,
    status: exhibition.status,
    watermarked: exhibition.watermarkApplied,
    copyright: exhibition.copyrightText,
    errorMessage: exhibition.errorMessage,
    publishedAt: exhibition.publishedAt,
  };
}



/** UC-27: Organizer switches an item between READY / PUBLISHED / ARCHIVED. */
export async function updateExhibitionStatus(
  exhibitionId: string,
  ownerId: string,
  status: "PUBLISHED" | "READY" | "ARCHIVED",
) {
  const row = await ownedExhibition(exhibitionId, ownerId);
  if (status === "PUBLISHED") {
    if (!row.exhibition.webpKey || !row.exhibition.watermarkApplied) {
      throw AppError.conflict("Exhibition preview must be processed with a watermark before publishing");
    }
    await assertEligibleForPublic(row);
  }

  const now = new Date();
  const [updated] = await db
    .update(exhibitionImages)
    .set({
      status,
      publishedBy: status === "PUBLISHED" ? ownerId : row.exhibition.publishedBy,
      publishedAt: status === "PUBLISHED" ? (row.exhibition.publishedAt ?? now) : row.exhibition.publishedAt,
      updatedAt: now,
    })
    .where(eq(exhibitionImages.id, exhibitionId))
    .returning();

  return {
    exhibitionId: updated.id,
    submissionId: updated.submissionId,
    contestId: updated.contestId,
    status: updated.status,
    watermarked: updated.watermarkApplied,
    copyright: updated.copyrightText,
    imageUrl: updated.status === "PUBLISHED" ? `/api/v1/exhibitions/${updated.id}/image` : null,
    publishedAt: updated.publishedAt,
  };
}

/** Soft delete (BR-03): the row is kept, the item disappears from the public gallery. */
export async function softDeleteExhibition(exhibitionId: string, ownerId: string) {
  await ownedExhibition(exhibitionId, ownerId);
  const now = new Date();
  const [deleted] = await db
    .update(exhibitionImages)
    .set({ isDeleted: true, status: "ARCHIVED", updatedAt: now })
    .where(eq(exhibitionImages.id, exhibitionId))
    .returning({ id: exhibitionImages.id, status: exhibitionImages.status, isDeleted: exhibitionImages.isDeleted });

  return deleted;
}


export interface ListPublicExhibitionsQuery {
  contestId?: string;
  year?: number;
  award?: string;
  filmStock?: string;
  camera?: string;
  filmFormat?: string;
  aiTag?: string;
  page: number;
  limit: number;
}

type PublicExhibitionRow = {
  exhibition: typeof exhibitionImages.$inferSelect;
  contest: {
    id: string;
    name: string;
    publishedAt: Date | null;
    startAt: Date | null;
    createdAt: Date;
  };
  submission: {
    id: string;
    title: string;
    description: string | null;
  };
  categoryName: string;
  authorName: string;
  metadata: typeof filmMetadata.$inferSelect | null;
  aiTags: unknown;
  publication: typeof contestPublications.$inferSelect | null;
};

function combinedFilmStock(metadata: typeof filmMetadata.$inferSelect | null) {
  if (!metadata) return null;
  return metadata.filmStock.toLowerCase().includes(metadata.filmBrand.toLowerCase())
    ? metadata.filmStock
    : `${metadata.filmBrand} ${metadata.filmStock}`;
}

function mapPublicItem(row: PublicExhibitionRow) {
  const official = findOfficialEntry(row.publication?.entries, row.submission.id);
  return {
    id: row.exhibition.id,
    submissionId: row.submission.id,
    contestId: row.contest.id,
    contestName: row.contest.name,
    categoryName: row.categoryName,
    title: row.submission.title,
    author: row.authorName,
    filmStock: combinedFilmStock(row.metadata),
    camera: row.metadata?.cameraBody ?? null,
    filmFormat: row.metadata?.filmFormat ?? null,
    year: resolveContestYear(row.contest, row.publication?.publishedAt),
    award: official?.award ?? null,
    awardTitle: official?.awardTitle ?? null,
    rank: official?.rank ?? null,
    finalScore: official?.finalScore ?? null,
    aiTags: toTagList(row.aiTags),
    imageUrl: `/api/v1/exhibitions/${row.exhibition.id}/image`,
    watermarked: true,
    copyright: row.exhibition.copyrightText,
    publishedAt: row.exhibition.publishedAt,
  };
}

function loadPublishedExhibitionRows(
  query: Pick<ListPublicExhibitionsQuery, "contestId">,
  exhibitionId?: string,
): Promise<PublicExhibitionRow[]> {
  const filters = publicVisibilityFilters();
  if (query.contestId) filters.push(eq(exhibitionImages.contestId, query.contestId));
  if (exhibitionId) filters.push(eq(exhibitionImages.id, exhibitionId));

  return db
    .select({
      exhibition: exhibitionImages,
      contest: {
        id: contests.id,
        name: contests.name,
        publishedAt: contests.publishedAt,
        startAt: contests.startAt,
        createdAt: contests.createdAt,
      },
      submission: {
        id: submissions.id,
        title: submissions.title,
        description: submissions.description,
      },
      categoryName: categories.name,
      authorName: users.fullName,
      metadata: filmMetadata,
      aiTags: submissionAiAnalyses.predictedTags,
      publication: contestPublications,
    })
    .from(exhibitionImages)
    .innerJoin(contests, eq(contests.id, exhibitionImages.contestId))
    .innerJoin(submissions, eq(submissions.id, exhibitionImages.submissionId))
    .innerJoin(categories, eq(categories.id, submissions.categoryId))
    .innerJoin(users, eq(users.id, submissions.participantId))
    .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .leftJoin(submissionAiAnalyses, eq(submissionAiAnalyses.submissionId, submissions.id))
    .leftJoin(contestPublications, eq(contestPublications.contestId, contests.id))
    .where(and(...filters))
    .orderBy(desc(exhibitionImages.publishedAt), desc(exhibitionImages.createdAt));
}

function matchesFilter(value: string | null, filter?: string) {
  if (!filter) return true;
  return value?.toLowerCase().includes(filter.toLowerCase()) ?? false;
}

function toTagList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/** UC-43 public façade for the exhibition gallery: published, watermarked items only. */
export async function listPublicExhibitions(query: ListPublicExhibitionsQuery) {
  const mapped = (await loadPublishedExhibitionRows(query))
    .map((row) => mapPublicItem(row))
    .filter((item) => {
      if (query.year !== undefined && item.year !== query.year) return false;
      if (query.award) {
        const q = query.award.toLowerCase();
        const matchesAward = item.award?.toLowerCase().includes(q) || item.awardTitle?.toLowerCase().includes(q);
        if (!matchesAward) return false;
      }
      if (!matchesFilter(item.filmStock, query.filmStock)) return false;
      if (!matchesFilter(item.camera, query.camera)) return false;
      if (query.filmFormat && item.filmFormat?.toLowerCase() !== query.filmFormat.toLowerCase()) return false;
      if (query.aiTag) {
        const q = query.aiTag.toLowerCase();
        if (!item.aiTags.some((tag) => tag.toLowerCase() === q)) return false;
      }
      return true;
    });

  const total = mapped.length;
  const start = (query.page - 1) * query.limit;

  return {
    items: mapped.slice(start, start + query.limit),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 0,
    },
  };
}

export async function getPublicExhibitionDetail(exhibitionId: string) {
  const [row] = await loadPublishedExhibitionRows({}, exhibitionId);
  if (!row) {
    throw AppError.notFound("Exhibition image not found");
  }

  const official = findOfficialEntry(row.publication?.entries, row.submission.id);

  return {
    id: row.exhibition.id,
    submissionId: row.submission.id,
    contestId: row.contest.id,
    contestName: row.contest.name,
    categoryName: row.categoryName,
    title: row.submission.title,
    description: row.submission.description,
    author: row.authorName,
    filmBrand: row.metadata?.filmBrand ?? null,
    filmStock: combinedFilmStock(row.metadata),
    iso: row.metadata?.isoShot ?? row.metadata?.isoRated ?? null,
    camera: row.metadata?.cameraBody ?? null,
    lens: row.metadata?.lens ?? null,
    filmFormat: row.metadata?.filmFormat ?? null,
    lab: row.metadata?.devLabName ?? null,
    scannerModel: row.metadata?.scannerModel ?? null,
    year: resolveContestYear(row.contest, row.publication?.publishedAt),
    award: official?.award ?? null,
    awardTitle: official?.awardTitle ?? null,
    rank: official?.rank ?? null,
    finalScore: official?.finalScore ?? null,
    aiTags: toTagList(row.aiTags),
    imageUrl: `/api/v1/exhibitions/${row.exhibition.id}/image`,
    watermarked: true,
    copyright: row.exhibition.copyrightText,
    publishedAt: row.exhibition.publishedAt,
  };
}

/** Serves only the watermarked WebP preview; the master never leaves the private bucket. */
export async function getPublicExhibitionImage(exhibitionId: string) {
  const [row] = await loadPublishedExhibitionRows({}, exhibitionId);
  if (!row?.exhibition.webpKey) {
    throw AppError.notFound("Exhibition image not found");
  }

  const buffer = await readFromStorage(row.exhibition.webpKey);
  if (!buffer) {
    throw AppError.notFound("Exhibition image not found");
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=3600",
    },
  });
}



