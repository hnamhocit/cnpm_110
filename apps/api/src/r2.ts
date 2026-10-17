
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Lấy cấu hình R2 từ file .env
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

// Kiểm tra cấu hình
const isConfigured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucketName
);

// Kết nối Cloudflare R2
const r2 = isConfigured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null;

// Tạo Presigned URL để client upload trực tiếp lên R2
export async function generateUploadUrl(
  key: string,
  contentType: string
) {
  if (!r2 || !bucketName) {
    throw new Error("Cloudflare R2 is not configured");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  // URL có hiệu lực trong 15 phút
  return await getSignedUrl(r2, command, {
    expiresIn: 900,
  });
}
