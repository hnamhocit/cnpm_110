
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "node:stream";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

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

export async function uploadToR2(file: File, key: string) {
  const { client, bucketName } = getR2Config();

  try {
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

    return key;
  } finally {
    client.destroy();
  }
}

export async function deleteFromR2(key: string) {
  const { client, bucketName } = getR2Config();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
  } finally {
    client.destroy();
  }
}

export async function getR2SignedReadUrl(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  if (!key || !key.startsWith("submissions/")) {
    throw new Error("Invalid submission image key");
  }

  if (
    !Number.isInteger(expiresInSeconds) ||
    expiresInSeconds < 1 ||
    expiresInSeconds > 3600
  ) {
    throw new Error("Invalid URL expiration");
  }

  const { client, bucketName } = getR2Config();

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });
  } finally {
    client.destroy();
  }
}
