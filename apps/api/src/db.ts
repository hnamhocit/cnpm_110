import { Pool } from "pg";

function getPoolConfig() {
  const connectionString = Bun.env.DATABASE_URL ?? process.env.DATABASE_URL;
  if (connectionString) {
    return { connectionString };
  }

  const host = Bun.env.DB_HOST;
  const port = Bun.env.DB_PORT ? Number(Bun.env.DB_PORT) : undefined;
  const database = Bun.env.DB_NAME;
  const user = Bun.env.DB_USER;
  const password = Bun.env.DB_PASSWORD;

  if (host && port && database && user && password) {
    return { host, port, database, user, password };
  }

  return {
    connectionString:
      "postgresql://postgres:postgres@localhost:5432/film_contest",
  };
}

export const pool = new Pool({
  ...getPoolConfig(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});
