import { pool } from "./index";
import { seed } from "./seed";

try {
  const database = URL.parse(Bun.env.DATABASE_URL ?? "");
  if (
    Bun.env.NODE_ENV === "production" ||
    !database ||
    !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) ||
    database.pathname !== "/cinegen_demo"
  ) {
    throw new Error("Demo seed requires the local cinegen_demo database");
  }

  await seed();
} finally {
  await pool.end();
}
