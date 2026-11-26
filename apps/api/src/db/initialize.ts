import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pool } from "./index";
import { seed } from "./seed";

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Hold the same session lock through migrations and seed so simultaneous starts cannot race.
    await client.query("SELECT pg_advisory_lock(hashtext('cinegen:db:startup'))");
    await migrate(drizzle(client), {
      migrationsFolder: resolve(import.meta.dir, "../../drizzle"),
      migrationsSchema: "public",
      migrationsTable: "__drizzle_migrations",
    });
    await seed();
  } finally {
    // Closing the dedicated connection releases the session lock even if initialization failed.
    client.release(true);
  }
}
