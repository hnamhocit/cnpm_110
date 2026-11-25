import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AuthEnv } from "../middlewares/auth";
import { db } from "../db/index";
import {
  aiAnalysisJobs,
  categories,
  contests,
  contestJudges,
  filmMetadata,
  submissionAiAnalyses,
  submissionModerationLogs,
  submissions,
  users,
} from "../db/schema";
import { deleteFromR2, getR2SignedReadUrl, uploadToR2 } from "../r2";
import { AppError } from "../utils/errors";
import {
  ImageValidationError,
  validateImage,
} from "../utils/validate-image";

const MiB = 1024 * 1024;

type FilmMetadataRow = typeof filmMetadata.$inferSelect;

function mapFilmMetadata(meta: FilmMetadataRow | null | undefined) {
  if (!meta) return null;
  return {
    filmBrand: meta.filmBrand,
    filmStock: meta.filmStock,
    filmFormat: meta.filmFormat,
    isoRated: meta.isoRated,
    isoShot: meta.isoShot,
    cameraBody: meta.cameraBody,
    lens: meta.lens,
    rollId: meta.rollId,
    frameNumber: meta.frameNumber,
    devLabName: meta.devLabName,
    devChemistry: meta.devChemistry,
    scannerModel: meta.scannerModel,
  };
}

export interface ListMySubmissionsQuery {
  participantId: string;
  contestId?: string;
  status?: string;
}

export async function listMySubmissions(query: ListMySubmissionsQuery) {
  const { participantId, contestId, status } = query;

  const conditions: SQL[] = [eq(submissions.participantId, participantId)];
  if (contestId) conditions.push(eq(submissions.contestId, contestId));
  if (status) conditions.push(eq(submissions.status, status));

  const rows = await db
    .select({
      sub: submissions,
      cat: categories,
      con: contests,
      meta: filmMetadata,
      ai: submissionAiAnalyses,
    })
    .from(submissions)
    .leftJoin(categories, eq(submissions.categoryId, categories.id))
    .leftJoin(contests, eq(submissions.contestId, contests.id))
    .leftJoin(filmMetadata, eq(submissions.id, filmMetadata.submissionId))
    .leftJoin(
      submissionAiAnalyses,
      eq(submissions.id, submissionAiAnalyses.submissionId),
    )
    .where(and(...conditions))
    .orderBy(desc(submissions.createdAt));

  return rows.map(({ sub, cat, con, meta, ai }) => ({
    id: sub.id,
    contestId: sub.contestId,
    contestTitle: con?.name ?? null,
    categoryId: sub.categoryId,
    categoryName: cat?.name ?? null,
    participantId: sub.participantId,
    title: sub.title,
    description: sub.description,
    rejectionReason: sub.rejectionReason,
    imageOriginalPath: sub.imageOriginalPath,
    imagePreviewPath: sub.imagePreviewPath,
    negativeProofPath: sub.negativeProofPath,
    fileSizeBytes: sub.fileSizeBytes != null ? Number(sub.fileSizeBytes) : null,
    width: sub.width,
    height: sub.height,
    status: sub.status,
    aiFlagged: sub.status === "FLAGGED" || ai?.isAiFlagged === true,
    filmMetadata: mapFilmMetadata(meta),
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  }));
}

export interface ListAllSubmissionsQuery {
  organizerId?: string;
  contestId?: string;
  categoryId?: string;
  status?: string;
  aiFlagged?: boolean;
  search?: string;
  page: number;
  limit: number;
}

export async function listAllSubmissions(query: ListAllSubmissionsQuery) {
  const { contestId, categoryId, status, aiFlagged, search, page, limit, organizerId } =
    query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (organizerId) conditions.push(eq(contests.createdBy, organizerId));

  if (contestId) conditions.push(eq(submissions.contestId, contestId));
  if (categoryId) conditions.push(eq(submissions.categoryId, categoryId));
  if (status) conditions.push(eq(submissions.status, status));

  if (aiFlagged === true) {
    conditions.push(
      or(
        eq(submissions.status, "FLAGGED"),
        eq(submissionAiAnalyses.isAiFlagged, true),
      )!,
    );
  } else if (aiFlagged === false) {
    conditions.push(
      and(
        ne(submissions.status, "FLAGGED"),
        or(
          sql`${submissionAiAnalyses.isAiFlagged} IS NULL`,
          eq(submissionAiAnalyses.isAiFlagged, false),
        ),
      )!,
    );
  }

  if (search) {
    conditions.push(
      or(
        ilike(submissions.title, `%${search}%`),
        ilike(submissions.description, `%${search}%`),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[countResult], rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(submissions)
      .innerJoin(contests, eq(contests.id, submissions.contestId))
      .leftJoin(
        submissionAiAnalyses,
        eq(submissionAiAnalyses.submissionId, submissions.id),
      )
      .where(whereClause),
    db
      .select({
        submission: submissions,
        metadata: filmMetadata,
        aiAnalysis: submissionAiAnalyses,
        author: users,
      })
      .from(submissions)
      .innerJoin(contests, eq(contests.id, submissions.contestId))
      .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
      .leftJoin(
        submissionAiAnalyses,
        eq(submissionAiAnalyses.submissionId, submissions.id),
      )
      .leftJoin(users, eq(submissions.participantId, users.id))
      .where(whereClause)
      .orderBy(desc(submissions.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = Number(countResult?.value ?? 0);

  const items = rows.map(({ submission: sub, metadata: meta, aiAnalysis: ai, author }) => ({
    id: sub.id,
    contestId: sub.contestId,
    categoryId: sub.categoryId,
    participantId: sub.participantId,
    authorName: author?.fullName || author?.email || "Thí sinh ẩn danh",
    title: sub.title,
    description: sub.description,
    rejectionReason: sub.rejectionReason,
    imageOriginalPath: sub.imageOriginalPath,
    imagePreviewPath: sub.imagePreviewPath,
    negativeProofPath: sub.negativeProofPath,
    fileSizeBytes: sub.fileSizeBytes != null ? Number(sub.fileSizeBytes) : null,
    width: sub.width,
    height: sub.height,
    status: sub.status,
    aiFlagged: sub.status === "FLAGGED" || ai?.isAiFlagged === true,
    filmMetadata: mapFilmMetadata(meta),
    aiAnalysis: ai
      ? {
        aiGeneratedProbability: Number(ai.aiGeneratedProbability),
        isAiFlagged: ai.isAiFlagged,
        phashHex: ai.phashHex,
        duplicateSuspectId: ai.duplicateSuspectId,
        duplicateSimilarityScore:
          ai.duplicateSimilarityScore != null
            ? Number(ai.duplicateSimilarityScore)
            : null,
        predictedTags: ai.predictedTags,
        flagReasons: ai.flagReasons,
      }
      : null,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export interface CreateSubmissionInput {
  participantId: string;
  contestId: string;
  categoryId: string;
  title: string;
  description: string | null;
  metadata: {
    filmBrand: string;
    filmStock: string;
    filmFormat: string;
    isoRated: number;
    isoShot: number;
    cameraBody: string;
    lens: string | null;
    rollId: string;
    frameNumber: string;
    devLabName: string | null;
    devChemistry: string | null;
    scannerModel: string | null;
  };
  image: File;
  negativeProof: File | null;
}

export async function createSubmission(input: CreateSubmissionInput) {
  const {
    participantId,
    contestId,
    categoryId,
    title,
    description,
    metadata,
    image,
    negativeProof,
  } = input;

  if (image.size > 25 * MiB || (negativeProof && negativeProof.size > 20 * MiB)) {
    throw new AppError(
      "Image limit: 25 MiB; negative proof limit: 20 MiB",
      413,
    );
  }

  let validatedImage;
  let validatedProof = null;

  try {
    validatedImage = await validateImage(image, {
      maxBytes: 25 * MiB,
      minWidth: 2000,
      minHeight: 2000,
      maxPixels: 100_000_000,
      allowedTypes: ["image/jpeg", "image/tiff"],
    });

    if (negativeProof) {
      validatedProof = await validateImage(negativeProof, {
        maxBytes: 20 * MiB,
        minWidth: 1,
        minHeight: 1,
        maxPixels: 100_000_000,
      });
    }
  } catch (err) {
    if (err instanceof ImageValidationError) {
      throw new AppError(err.message, err.status as ContentfulStatusCode);
    }
    throw err;
  }

  const [participant] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, participantId), eq(users.isActive, true)))
    .limit(1);

  if (!participant) {
    throw AppError.forbidden("Account is unavailable");
  }

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.contestId, contestId),
      ),
    )
    .limit(1);

  if (!category) {
    throw AppError.badRequest("Category does not belong to this contest");
  }

  const [contest] = await db
    .select({
      id: contests.id,
      createdBy: contests.createdBy,
      startAt: contests.startAt,
      endAt: contests.endAt,
      status: contests.status,
      isDeleted: contests.isDeleted,
    })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);

  if (!contest || contest.isDeleted) {
    throw AppError.notFound("Contest not found or unavailable");
  }

  if (!["open", "ongoing"].includes(contest.status.toLowerCase())) {
    throw AppError.badRequest("Contest is not accepting submissions");
  }

  const now = new Date();
  if (contest.startAt && now < contest.startAt) {
    throw AppError.badRequest("Contest has not started yet");
  }
  if (contest.endAt && now >= contest.endAt) {
    throw AppError.badRequest("Submission deadline has passed");
  }

  const [assignment] = await db.select({ id: contestJudges.id })
    .from(contestJudges)
    .where(and(
      eq(contestJudges.contestId, contestId),
      eq(contestJudges.judgeId, participantId),
      eq(contestJudges.isActive, true),
    ))
    .limit(1);

  if (contest.createdBy === participantId || assignment) {
    throw AppError.forbidden("A contest organizer or assigned judge cannot submit to the same contest");
  }

  const id = crypto.randomUUID();
  const imageKey = `submissions/${participantId}/${id}.${validatedImage.extension}`;
  const proofKey =
    negativeProof && validatedProof
      ? `proofs/${participantId}/${id}.${validatedProof.extension}`
      : null;

  const cleanupKeys: string[] = [];

  try {
    cleanupKeys.push(imageKey);
    await uploadToR2(
      new File([image], image.name, { type: validatedImage.contentType }),
      imageKey,
    );

    if (negativeProof && proofKey && validatedProof) {
      cleanupKeys.push(proofKey);
      await uploadToR2(
        new File([negativeProof], negativeProof.name, {
          type: validatedProof.contentType,
        }),
        proofKey,
      );
    }

    await db.transaction(async (tx) => {
      const frameKey = JSON.stringify([contestId, participantId, metadata.rollId, metadata.frameNumber]);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${frameKey}, 0))`);

      // BR-05: Chống nộp trùng cuộn phim + số frame trong cùng cuộc thi
      const [duplicateFrame] = await tx
        .select({ id: submissions.id })
        .from(submissions)
        .innerJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
        .where(
          and(
            eq(submissions.contestId, contestId),
            eq(submissions.participantId, participantId),
            eq(filmMetadata.rollId, metadata.rollId),
            eq(sql`ltrim(${filmMetadata.frameNumber}, '0')`, metadata.frameNumber),
          ),
        )
        .limit(1);

      if (duplicateFrame) {
        throw AppError.conflict(
          "This film roll and frame have already been submitted to this contest",
        );
      }

      await tx.insert(submissions).values({
        id,
        contestId,
        categoryId,
        participantId,
        title,
        description,
        imageOriginalPath: imageKey,
        negativeProofPath: proofKey,
        fileSizeBytes: BigInt(image.size),
        width: validatedImage.width,
        height: validatedImage.height,
        status: "PENDING_AI",
      });

      await tx.insert(filmMetadata).values({
        submissionId: id,
        ...metadata,
      });

      await tx.insert(aiAnalysisJobs).values({
        submissionId: id,
        status: "PENDING",
        attempts: 0,
        maxAttempts: 3,
      });
    });

    cleanupKeys.length = 0;

    return {
      id,
      contestId,
      categoryId,
      participantId,
      title,
      imageOriginalPath: imageKey,
      negativeProofPath: proofKey,
      fileSizeBytes: image.size,
      width: validatedImage.width,
      height: validatedImage.height,
      status: "PENDING_AI",
    };
  } catch (err) {
    if (cleanupKeys.length > 0) {
      const results = await Promise.allSettled(
        cleanupKeys.map((key) => deleteFromR2(key)),
      );
      results.forEach((res, idx) => {
        if (res.status === "rejected") {
          console.error("R2 cleanup failed for key:", cleanupKeys[idx]);
        }
      });
    }
    throw err;
  }
}

type ModerationActor = AuthEnv["Variables"]["user"];

function requireMutableContest(contest: typeof contests.$inferSelect, actor: ModerationActor) {
  if (contest.isDeleted || actor.role !== "Organizer" || contest.createdBy !== actor.id) {
    throw AppError.notFound("Submission not found");
  }

  if (["published", "completed", "archived"].includes(contest.status.toLowerCase())) {
    throw AppError.forbidden("Published submissions are read-only");
  }
}

async function verifyApprovalReason(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  submission: { id: string; status: string },
  reason: string,
) {
  const [analysis] = await tx.select({ flagged: submissionAiAnalyses.isAiFlagged })
    .from(submissionAiAnalyses)
    .where(eq(submissionAiAnalyses.submissionId, submission.id))
    .limit(1);

  const flagged = analysis?.flagged ||
    ["FLAGGED", "AI_FLAGGED_HIGH_RISK", "SUSPICIOUS"].includes(submission.status);
  if (flagged && !reason) {
    throw new AppError("A reason is required to approve a flagged submission", 422);
  }
  return flagged === true;
}

export async function approveSubmission(
  submissionId: string,
  actor: ModerationActor,
  reason?: string,
) {
  return db.transaction(async (tx) => {
    const [submission] = await tx
      .select({ id: submissions.id, status: submissions.status, contest: contests })
      .from(submissions)
      .innerJoin(contests, eq(contests.id, submissions.contestId))
      .where(eq(submissions.id, submissionId))
      .for("update")
      .limit(1);

    if (!submission) {
      throw AppError.notFound("Submission not found");
    }
    requireMutableContest(submission.contest, actor);

    if (
      submission.status === "APPROVED" ||
      submission.status === "APPROVED_FOR_JUDGING"
    ) {
      throw AppError.conflict("Submission has already been processed");
    }

    const approvalReason = reason?.trim() ?? "";
    const flagged = await verifyApprovalReason(tx, submission, approvalReason);

    const [updated] = await tx
      .update(submissions)
      .set({
        status: "APPROVED",
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(submissions.id, submissionId),
          eq(submissions.status, submission.status),
        ),
      )
      .returning({
        id: submissions.id,
        status: submissions.status,
        updatedAt: submissions.updatedAt,
      });

    if (!updated) {
      throw AppError.conflict("Submission status changed; please try again");
    }

    await tx.insert(submissionModerationLogs).values({
      submissionId,
      moderatorId: actor.id,
      action: flagged ? "OVERRIDE_AI_FLAG" : "APPROVE_FOR_JUDGING",
      reason: approvalReason || "Approved for judging by organizer",
      previousStatus: submission.status,
      newStatus: "APPROVED",
    });

    return updated;
  });
}

export async function rejectSubmission(
  submissionId: string,
  actor: ModerationActor,
  reason: string,
) {
  return db.transaction(async (tx) => {
    const [submission] = await tx
      .select({ id: submissions.id, status: submissions.status, contest: contests })
      .from(submissions)
      .innerJoin(contests, eq(contests.id, submissions.contestId))
      .where(eq(submissions.id, submissionId))
      .for("update")
      .limit(1);

    if (!submission) {
      throw AppError.notFound("Submission not found");
    }
    requireMutableContest(submission.contest, actor);

    if (
      submission.status === "DISQUALIFIED" ||
      submission.status === "DISQUALIFIED_NO_PROOF"
    ) {
      throw AppError.conflict("Submission has already been processed");
    }

    const [updated] = await tx
      .update(submissions)
      .set({
        status: "DISQUALIFIED",
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(submissions.id, submissionId),
          eq(submissions.status, submission.status),
        ),
      )
      .returning({
        id: submissions.id,
        status: submissions.status,
        rejectionReason: submissions.rejectionReason,
        updatedAt: submissions.updatedAt,
      });

    if (!updated) {
      throw AppError.conflict("Submission status changed; please try again");
    }

    await tx.insert(submissionModerationLogs).values({
      submissionId,
      moderatorId: actor.id,
      action: "DISQUALIFY",
      reason,
      previousStatus: submission.status,
      newStatus: "DISQUALIFIED",
    });

    return updated;
  });
}

export type ModerationAction =
  | "APPROVE_FOR_JUDGING"
  | "DISQUALIFY"
  | "REQUEST_PROOF"
  | "OVERRIDE_AI_FLAG";

export async function moderateSubmission(
  submissionId: string,
  actor: ModerationActor,
  action: ModerationAction,
  reasonText: string,
) {
  return db.transaction(async (tx) => {
    const [submission] = await tx
      .select({ id: submissions.id, status: submissions.status, contest: contests })
      .from(submissions)
      .innerJoin(contests, eq(contests.id, submissions.contestId))
      .where(eq(submissions.id, submissionId))
      .for("update")
      .limit(1);

    if (!submission) {
      throw AppError.notFound("Submission not found");
    }
    requireMutableContest(submission.contest, actor);

    let loggedAction = action;
    let newStatus = submission.status;
    let rejectionReason: string | undefined;

    if (action === "APPROVE_FOR_JUDGING" || action === "OVERRIDE_AI_FLAG") {
      if (await verifyApprovalReason(tx, submission, reasonText)) loggedAction = "OVERRIDE_AI_FLAG";
      newStatus = "APPROVED";
      rejectionReason = undefined;
    } else if (action === "DISQUALIFY") {
      newStatus = "DISQUALIFIED";
      rejectionReason = reasonText;
    } else if (action === "REQUEST_PROOF") {
      newStatus = "PROOF_REQUESTED";
    }

    const [updated] = await tx
      .update(submissions)
      .set({
        status: newStatus,
        ...(action === "APPROVE_FOR_JUDGING" ||
          action === "OVERRIDE_AI_FLAG" ||
          action === "DISQUALIFY"
          ? { rejectionReason: rejectionReason ?? null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId))
      .returning({
        id: submissions.id,
        status: submissions.status,
        rejectionReason: submissions.rejectionReason,
        updatedAt: submissions.updatedAt,
      });

    await tx.insert(submissionModerationLogs).values({
      submissionId,
      moderatorId: actor.id,
      action: loggedAction,
      reason: reasonText || "Action performed by organizer",
      previousStatus: submission.status,
      newStatus,
    });

    return updated;
  });
}

function reviewPreviewUrl(path: string) {
  const url = URL.parse(path);
  // Local seed previews reference public photos. Uploaded originals use keys.
  if (Bun.env.NODE_ENV !== "production" && url?.origin === "https://images.unsplash.com" &&
      url.pathname.startsWith("/photo-") && !url.username && !url.password) {
    return Promise.resolve(url.href);
  }
  return getR2SignedReadUrl(path);
}

export async function getSubmissionComparison(submissionId: string, actor: ModerationActor) {
  const [row] = await db
    .select({
      submission: submissions,
      metadata: filmMetadata,
      aiAnalysis: submissionAiAnalyses,
    })
    .from(submissions)
    .innerJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .leftJoin(
      submissionAiAnalyses,
      eq(submissionAiAnalyses.submissionId, submissions.id),
    )
    .where(and(
      eq(submissions.id, submissionId),
      actor.role === "Organizer" ? eq(contests.createdBy, actor.id) : undefined,
    ))
    .limit(1);

  if (!row) {
    throw AppError.notFound("Submission not found");
  }

  const { submission: sub, metadata: meta, aiAnalysis: ai } = row;

  const isAiFlagged = sub.status === "FLAGGED" || ai?.isAiFlagged === true;
  const aiProb =
    ai?.aiGeneratedProbability != null
      ? Number(ai.aiGeneratedProbability)
      : null;
  const phashHex = ai?.phashHex ?? null;
  const duplicateSuspectId = ai?.duplicateSuspectId ?? null;
  const similarityScore =
    ai?.duplicateSimilarityScore != null
      ? Number(ai.duplicateSimilarityScore)
      : null;
  const hammingDistance =
    similarityScore != null
      ? Math.round(64 * (1 - similarityScore))
      : null;

  let originalSubmission = null;
  if (duplicateSuspectId) {
    const [origRow] = await db
      .select({
        submission: submissions,
        metadata: filmMetadata,
      })
      .from(submissions)
      .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
      .where(and(
        eq(submissions.id, duplicateSuspectId),
        actor.role === "Organizer" ? eq(submissions.contestId, sub.contestId) : undefined,
      ))
      .limit(1);

    if (origRow) {
      const orig = origRow.submission;
      originalSubmission = {
        id: orig.id,
        contestId: orig.contestId,
        categoryId: orig.categoryId,
        participantId: orig.participantId,
        title: orig.title,
        description: orig.description,
        imageOriginalPath: orig.imageOriginalPath,
        imagePreviewPath: await reviewPreviewUrl(orig.imagePreviewPath ?? orig.imageOriginalPath),
        negativeProofPath: null,
        fileSizeBytes:
          orig.fileSizeBytes != null ? Number(orig.fileSizeBytes) : null,
        width: orig.width,
        height: orig.height,
        status: orig.status,
        createdAt: orig.createdAt,
        updatedAt: orig.updatedAt,
        filmMetadata: mapFilmMetadata(origRow.metadata),
      };
    }
  }

  const flagReasons: string[] =
    Array.isArray(ai?.flagReasons) && (ai.flagReasons as unknown[]).length > 0
      ? [...(ai.flagReasons as string[])]
      : [];

  if (flagReasons.length === 0) {
    if (duplicateSuspectId) {
      flagReasons.push(
        "Near-duplicate found",
      );
    }
    if (sub.status === "FLAGGED" && flagReasons.length === 0) {
      flagReasons.push(
        "Submission flagged for manual inspection by contest administrator",
      );
    }
  }

  const predictedTags = Array.isArray(ai?.predictedTags) ? ai.predictedTags : [];

  const [previewUrl, proofUrl] = await Promise.all([
    reviewPreviewUrl(sub.imagePreviewPath ?? sub.imageOriginalPath),
    sub.negativeProofPath ? getR2SignedReadUrl(sub.negativeProofPath) : null,
  ]);

  return {
    submissionId: sub.id,
    status: sub.status,
    isAiFlagged,
    aiGeneratedProbability: aiProb,
    phashHex,
    duplicateCheck: {
      isSuspect: duplicateSuspectId != null,
      suspectSubmissionId: originalSubmission?.id ?? null,
      hammingDistance: originalSubmission ? hammingDistance : null,
      similarityScore: originalSubmission ? similarityScore : null,
    },
    predictedTags,
    flagReasons,
    flaggedSubmission: {
      id: sub.id,
      contestId: sub.contestId,
      categoryId: sub.categoryId,
      participantId: sub.participantId,
      title: sub.title,
      description: sub.description,
      rejectionReason: sub.rejectionReason,
      imageOriginalPath: sub.imageOriginalPath,
      imagePreviewPath: previewUrl,
      negativeProofPath: proofUrl,
      fileSizeBytes:
        sub.fileSizeBytes != null ? Number(sub.fileSizeBytes) : null,
      width: sub.width,
      height: sub.height,
      status: sub.status,
      filmMetadata: mapFilmMetadata(meta),
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    },
    originalSubmission,
    analyzedAt: ai?.createdAt ?? sub.createdAt,
  };
}
