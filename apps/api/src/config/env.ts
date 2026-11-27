import { validateEnvironment } from "./validate";

/** Validated application environment, captured once when this module is imported. */
const { required, optional, port, smtpPort, aiWorkerEnabled } = validateEnvironment(process.env);

export const env = Object.freeze({
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  nodeEnv: optional("NODE_ENV") ?? "development",
  port,
  aiWorkerEnabled,
  aiWebhookSecret: optional("AI_WEBHOOK_SECRET"),
  aiModelUrl: optional("AI_MODEL_URL"),
  aiModelApiKey: optional("AI_MODEL_API_KEY"),
  aiAnalyticsUrl: optional("AI_ANALYTICS_URL"),
  aiAnalyticsApiKey: optional("AI_ANALYTICS_API_KEY"),
  smtpHost: required("SMTP_HOST"), smtpPort, smtpUser: required("SMTP_USER"),
  smtpPassword: required("SMTP_PASSWORD"), smtpFrom: required("SMTP_FROM"),
  passwordResetUrl: optional("PASSWORD_RESET_URL"),
  r2AccountId: optional("R2_ACCOUNT_ID"),
  r2AccessKeyId: optional("R2_ACCESS_KEY_ID"),
  r2SecretAccessKey: optional("R2_SECRET_ACCESS_KEY"),
  r2BucketName: optional("R2_BUCKET_NAME"),
  aiGeneratedFlagThreshold: optional("AI_GENERATED_FLAG_THRESHOLD"),
  aiDuplicateMaxPhashDistance: optional("AI_DUPLICATE_MAX_PHASH_DISTANCE"),
});
