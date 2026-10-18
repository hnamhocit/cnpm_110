import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { db } from "../db/index";
import { categories, filmMetadata, submissions, users } from "../db/schema";
import {
  authenticate,
  requireRoles,
  type AuthEnv,
} from "../middlewares/auth";
import { deleteFromR2, uploadToR2 } from "../r2";

const route = new Hono<AuthEnv>();
const MiB = 1024 * 1024;

class InputError extends Error {}

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

async function imageExtension(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (
    file.type === "image/jpeg" &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpg";
  }

  const png = [137, 80, 78, 71, 13, 10, 26, 10];

  if (
    file.type === "image/png" &&
    png.every((byte, index) => bytes[index] === byte)
  ) {
    return "png";
  }

  const signature = new TextDecoder().decode(bytes);

  if (
    file.type === "image/webp" &&
    signature.slice(0, 4) === "RIFF" &&
    signature.slice(8, 12) === "WEBP"
  ) {
    return "webp";
  }

  throw new InputError("File must have a matching JPEG, PNG or WebP signature");
}

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

      const extension = await imageExtension(image);
      const proofExtension = proof ? await imageExtension(proof) : null;

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
      await uploadToR2(image, imageKey);

      if (proof && proofKey) {
        cleanupKeys.push(proofKey);
        await uploadToR2(proof, proofKey);
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