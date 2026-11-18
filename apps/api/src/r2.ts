import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "node:stream";
import fs from "node:fs";
import path from "node:path";

function isR2Configured(): boolean {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();

  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Cloudflare R2 is not configured");
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucketName };
}

async function* readFileChunks(file: File) {
  const reader = file.stream().getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function uploadToR2(file: File, key: string): Promise<string> {
  if (isR2Configured()) {
    try {
      const { client, bucketName } = getR2Config();

      const upload = new Upload({
        client,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: Readable.from(readFileChunks(file)),
          ContentType: file.type,
        },
        partSize: 8 * 1024 * 1024,
        queueSize: 2,
        leavePartsOnError: false,
      });

      await upload.done();
      client.destroy();
      return key;
    } catch (error) {
      console.warn("Cloudflare R2 upload failed, falling back to local storage:", error);
    }
  }

  // Local storage fallback
  const uploadDir = path.resolve(process.cwd(), "uploads");
  const targetPath = path.resolve(uploadDir, key);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
  console.log(`[Storage Fallback] Image successfully saved locally: ${targetPath}`);
  return key;
}

export async function deleteFromR2(key: string): Promise<void> {
  if (isR2Configured()) {
    try {
      const { client, bucketName } = getR2Config();
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        }),
      );
      client.destroy();
    } catch (error) {
      console.warn("Cloudflare R2 delete failed:", error);
    }
  }

  // Local file delete
  const targetPath = path.resolve(process.cwd(), "uploads", key);
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
    } catch {}
  }
}

export async function getR2SignedReadUrl(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  if (isR2Configured()) {
    try {
      const { client, bucketName } = getR2Config();
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const url = await getSignedUrl(client, command, {
        expiresIn: expiresInSeconds,
      });
      client.destroy();
      return url;
    } catch (error) {
      console.warn("Cloudflare R2 signed URL failed, using local URL:", error);
    }
  }

  return `/uploads/${key}`;
}
