import {
  validateImage,
  ImageValidationError,
} from "../utils/validate-image";
import { and, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { db } from "../db/index";
import {
  categories,
  filmMetadata,
  submissionAiAnalyses,
  submissions,
  users,
} from "../db/schema";
import {
  authenticate,
  requireRoles,
  type AuthEnv,
} from "../middlewares/auth";
import { deleteFromR2, uploadToR2 } from "../r2";

const route = new Hono<AuthEnv>();
const MiB = 1024 * 1024;

class InputError extends Error { }

function textField(
  form: FormData,
  name: string,
  maxLength: number,
  required = false,
): string | null {
  const values = form.getAll(name);

  if (values.length > 1) {
    throw new InputError(`${name} must appear only once`);
  }

  const value = values[0];

  if (value !== undefined && typeof value !== "string") {
    throw new InputError(`${name} must be text`);
  }

  const text = typeof value === "string" ? value.trim() : "";

  if (required && !text) {
    throw new InputError(`${name} is required`);
  }

  if (text.length > maxLength) {
    throw new InputError(`${name} exceeds ${maxLength} characters`);
  }

  return text || null;
}

function uuidField(form: FormData, name: string) {
  const value = textField(form, name, 36, true)!;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new InputError(`${name} must be a UUID`);
  }

  return value;
}

function positiveInteger(form: FormData, name: string) {
  const value = textField(form, name, 10, true)!;

  if (!/^\d+$/.test(value)) {
    throw new InputError(`${name} must be a positive integer`);
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number <= 0 || number > 2147483647) {
    throw new InputError(`${name} is outside the allowed range`);
  }

  return number;
}

function fileField(form: FormData, name: string, required: boolean) {
  const values = form.getAll(name);

  if (values.length > 1) {
    throw new InputError(`${name} must appear only once`);
  }

  const value = values[0];

  if (value === undefined && !required) {
    return null;
  }

  if (!(value instanceof File) || value.size === 0) {
    throw new InputError(`${name} must be a non-empty file`);
  }

  return value;
}

const VALID_SUBMISSION_STATUSES = [
  "PENDING_AI",
  "FLAGGED",
  "APPROVED",
  "DISQUALIFIED",
  "PROOF_REQUESTED",
  "PROOF_SUBMITTED",
  "WITHDRAWN",
  "APPROVED_FOR_JUDGING",
  "DISQUALIFIED_NO_PROOF",
] as const;

// GET /api/v1/submissions
// Organizer & Admin lấy danh sách bài nộp kèm bộ lọc trạng thái và cờ cảnh báo AI
route.get(
  "/",
  authenticate,
  requireRoles("Organizer", "Admin"),
  async (c) => {
    const statusParam = c.req.query("status");
    const aiFlaggedParam = c.req.query("aiFlagged");
    const contestId = c.req.query("contestId");
    const categoryId = c.req.query("categoryId");
    const search = c.req.query("search")?.trim();
    const page = Math.max(1, parseInt(c.req.query("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (contestId && !uuidRegex.test(contestId)) {
      return c.json(
        { success: false, code: 400, message: "Invalid contestId format" },
        400,
      );
    }

    if (categoryId && !uuidRegex.test(categoryId)) {
      return c.json(
        { success: false, code: 400, message: "Invalid categoryId format" },
        400,
      );
    }

    if (
      statusParam &&
      !VALID_SUBMISSION_STATUSES.includes(
        statusParam as (typeof VALID_SUBMISSION_STATUSES)[number],
      )
    ) {
      return c.json(
        {
          success: false,
          code: 400,
          message: `Invalid status. Allowed statuses: ${VALID_SUBMISSION_STATUSES.join(", ")}`,
        },
        400,
      );
    }

    if (
      aiFlaggedParam !== undefined &&
      aiFlaggedParam !== "true" &&
      aiFlaggedParam !== "false"
    ) {
      return c.json(
        {
          success: false,
          code: 400,
          message: "aiFlagged must be 'true' or 'false'",
        },
        400,
      );
    }

    const conditions = [];

    if (contestId) {
      conditions.push(eq(submissions.contestId, contestId));
    }

    if (categoryId) {
      conditions.push(eq(submissions.categoryId, categoryId));
    }

    if (statusParam) {
      conditions.push(eq(submissions.status, statusParam));
    }

    if (aiFlaggedParam === "true") {
      conditions.push(
        or(
          eq(submissions.status, "FLAGGED"),
          eq(submissionAiAnalyses.isAiFlagged, true),
        ),
      );
    } else if (aiFlaggedParam === "false") {
      conditions.push(
        and(
          ne(submissions.status, "FLAGGED"),
          or(
            sql`${submissionAiAnalyses.isAiFlagged} IS NULL`,
            eq(submissionAiAnalyses.isAiFlagged, false),
          ),
        ),
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(submissions.title, `%${search}%`),
          ilike(submissions.description, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    try {
      const [countResult] = await db
        .select({ value: count() })
        .from(submissions)
        .leftJoin(
          submissionAiAnalyses,
          eq(submissionAiAnalyses.submissionId, submissions.id),
        )
        .where(whereClause);

      const total = Number(countResult?.value ?? 0);

      const rows = await db
        .select({
          submission: submissions,
          metadata: filmMetadata,
          aiAnalysis: submissionAiAnalyses,
        })
        .from(submissions)
        .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
        .leftJoin(
          submissionAiAnalyses,
          eq(submissionAiAnalyses.submissionId, submissions.id),
        )
        .where(whereClause)
        .orderBy(desc(submissions.createdAt))
        .limit(limit)
        .offset(offset);

      const data = rows.map((row) => {
        const sub = row.submission;
        const meta = row.metadata;
        const ai = row.aiAnalysis;
        const isAiFlagged = sub.status === "FLAGGED" || ai?.isAiFlagged === true;

        return {
          id: sub.id,
          contestId: sub.contestId,
          categoryId: sub.categoryId,
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
          aiFlagged: isAiFlagged,
          filmMetadata: meta
            ? {
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
              }
            : null,
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
                filmGrainScore:
                  ai.filmGrainScore != null
                    ? Number(ai.filmGrainScore)
                    : null,
                predictedTags: ai.predictedTags,
                flagReasons: ai.flagReasons,
              }
            : null,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        };
      });

      return c.json({
        success: true,
        code: 200,
        message: "Submissions retrieved successfully",
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      console.error("Failed to list submissions:", error);
      return c.json(
        {
          success: false,
          code: 500,
          message: "Failed to retrieve submissions",
          detail: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  },
);

route.post(
  "/",
  authenticate,
  requireRoles("Participant"),
  bodyLimit({
    maxSize: 121 * MiB,
    onError: (c) =>
      c.json({ success: false, message: "Request exceeds 121 MiB" }, 413),
  }),
  async (c) => {
    if (
      !c.req.header("Content-Type")?.toLowerCase().startsWith("multipart/form-data")
    ) {
      return c.json(
        { success: false, message: "Use multipart/form-data" },
        415,
      );
    }

    let form: FormData;

    try {
      form = await c.req.formData();
    } catch {
      return c.json(
        { success: false, message: "Invalid multipart form" },
        400,
      );
    }

    const cleanupKeys: string[] = [];

    try {
      const participantId = c.get("user").id;
      const contestId = uuidField(form, "contestId");
      const categoryId = uuidField(form, "categoryId");
      const title = textField(form, "title", 255, true)!;
      const description = textField(form, "description", 5000);

      const metadata = {
        filmBrand: textField(form, "filmBrand", 100, true)!,
        filmStock: textField(form, "filmStock", 150, true)!,
        filmFormat: textField(form, "filmFormat", 50, true)!,
        isoRated: positiveInteger(form, "isoRated"),
        isoShot: positiveInteger(form, "isoShot"),
        cameraBody: textField(form, "cameraBody", 150, true)!,
        lens: textField(form, "lens", 150),
        rollId: textField(form, "rollId", 100),
        frameNumber: textField(form, "frameNumber", 20),
        devLabName: textField(form, "devLabName", 150),
        devChemistry: textField(form, "devChemistry", 50),
        scannerModel: textField(form, "scannerModel", 150),
      };

      const image = fileField(form, "image", true)!;
      const proof = fileField(form, "negativeProof", false);

      if (image.size > 100 * MiB || (proof && proof.size > 20 * MiB)) {
        return c.json(
          {
            success: false,
            message: "Image limit: 100 MiB; negative proof limit: 20 MiB",
          },
          413,
        );
      }

      // Proposed limits for testing; confirm with the team before merging.
      const validatedImage = await validateImage(image, {
        maxBytes: 100 * MiB,
        minWidth: 1000,
        minHeight: 1000,
        maxPixels: 100_000_000,
      });

      const validatedProof = proof
        ? await validateImage(proof, {
          maxBytes: 20 * MiB,
          minWidth: 1,
          minHeight: 1,
          maxPixels: 100_000_000,
        })
        : null;

      const extension = validatedImage.extension;
      const proofExtension = validatedProof?.extension ?? null;
      const [participant] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, participantId), eq(users.isActive, true)))
        .limit(1);

      if (!participant) {
        return c.json(
          { success: false, message: "Account is unavailable" },
          403,
        );
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
        return c.json(
          { success: false, message: "Category does not belong to this contest" },
          400,
        );
      }

      const id = crypto.randomUUID();
      const imageKey = `submissions/${participantId}/${id}.${extension}`;
      const proofKey = proof
        ? `proofs/${participantId}/${id}.${proofExtension}`
        : null;

      cleanupKeys.push(imageKey);
      const uploadImage = new File([image], image.name, {
        type: validatedImage.contentType,
      });

      await uploadToR2(uploadImage, imageKey);

      if (proof && proofKey && validatedProof) {
        cleanupKeys.push(proofKey);

        const uploadProof = new File([proof], proof.name, {
          type: validatedProof.contentType,
        });

        await uploadToR2(uploadProof, proofKey);
      }

      await db.transaction(async (tx) => {
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
      });

      cleanupKeys.length = 0;

      return c.json(
        {
          success: true,
          data: {
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
          },
        },
        201,
      );
    } catch (error) {
      const cleanupResults = await Promise.allSettled(
        cleanupKeys.map((key) => deleteFromR2(key)),
      );

      for (let index = 0; index < cleanupResults.length; index++) {
        if (cleanupResults[index]?.status === "rejected") {
          console.error("R2 cleanup failed for key:", cleanupKeys[index]);
        }
      }

      if (error instanceof ImageValidationError) {
        return c.json(
          { success: false, message: error.message },
          error.status,
        );
      }
      if (error instanceof InputError) {
        return c.json({ success: false, message: error.message }, 400);
      }

      console.error("Submission upload failed:", error);

      return c.json(
        { success: false, message: "Submission upload failed" },
        500,
      );
    }
  },
);

export default route;