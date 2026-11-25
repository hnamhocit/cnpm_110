import { Hono } from "hono";
import { authenticate, requirePermission, type AuthEnv } from "../middlewares/auth";
import { AppError } from "../utils/errors";
import { uploadToR2 } from "../r2";

const upload = new Hono<AuthEnv>();

upload.post("/", authenticate, requirePermission("storage:upload"), async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!(file instanceof File)) {
    throw AppError.badRequest("No file uploaded");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw AppError.badRequest("Invalid image type");
  }

  if (file.size === 0) {
    throw AppError.badRequest("Empty file");
  }

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new AppError("File exceeds 50MB", 413);
  }

  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[file.type];

  const key = `images/${crypto.randomUUID()}.${extension}`;
  await uploadToR2(file, key);

  return c.ok({ key, size: file.size }, "Upload successful");
});

export default upload
