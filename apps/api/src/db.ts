
import { Pool } from "pg";

const requiredEnv = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
] as const;

for (const key of requiredEnv) {
  if (!Bun.env[key]) {
    throw new Error(`Missing database configuration: ${key}`);
  }
}

export const pool = new Pool({
  host: Bun.env.DB_HOST,
  port: Number(Bun.env.DB_PORT),
  database: Bun.env.DB_NAME,
  user: Bun.env.DB_USER,
  password: Bun.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});
