/** Validate once at import; only variable names and presence are logged. */
export function validateEnvironment(source: NodeJS.ProcessEnv) {
  const optional = (name: string) => source[name]?.trim() || undefined;
  const aiWorkerEnabled = optional("AI_WORKER_ENABLED") === "true";
  const requiredNames = ["DATABASE_URL", "JWT_SECRET", "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM", ...(aiWorkerEnabled ? ["AI_MODEL_URL"] : [])];
  console.log(`[Config] Required: ${requiredNames.join(", ")}`);
  console.log("");
  const errors: string[] = [];
  for (const name of requiredNames) {
    if (!optional(name)) errors.push(`${name} is required in apps/api/.env`);
  }
  const databaseUrl = optional("DATABASE_URL");
  if (databaseUrl) {
    try {
      if (!["postgres:", "postgresql:"].includes(new URL(databaseUrl).protocol)) errors.push("DATABASE_URL must use postgres:// or postgresql://");
    } catch { errors.push("DATABASE_URL must be a valid PostgreSQL URL"); }
  }
  const numberPort = (name: string, fallback: number) => {
    const value = Number(optional(name) ?? fallback);
    if (!Number.isInteger(value) || value < 1 || value > 65535) errors.push(`${name} must be an integer between 1 and 65535`);
    return value;
  };
  const port = numberPort("PORT", 8080);
  const smtpPort = numberPort("SMTP_PORT", 587);
  if (errors.length) throw new Error(`[Config] Invalid environment:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return { required: (name: string): string => optional(name)!, optional, port, smtpPort, aiWorkerEnabled };
}
