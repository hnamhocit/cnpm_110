import { readMigrationFiles } from "drizzle-orm/migrator";
import { Client } from "pg";
import config from "../../drizzle.config";

async function resetDatabase() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const database = client.database;
  const confirmation = process.argv.slice(2);

  if (
    process.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1", "::1"].includes(client.host) ||
    !database ||
    ["postgres", "template0", "template1"].includes(database)
  ) {
    throw new Error("Reset requires a local development database in DATABASE_URL.");
  }
  if (confirmation.length !== 1 || confirmation[0] !== `--confirm=${database}`) {
    throw new Error("Pass --confirm=<database name> matching DATABASE_URL to erase its public schema.");
  }

  const migrations = readMigrationFiles({ migrationsFolder: config.out ?? "./drizzle" });
  if (migrations.length === 0) {
    throw new Error("No migrations found. The database was not reset.");
  }

  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('cinegen:db:reset'))");
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("CREATE SCHEMA public AUTHORIZATION pg_database_owner");
    await client.query("GRANT USAGE ON SCHEMA public TO PUBLIC");
    await client.query("SET LOCAL search_path TO public");

    // Match the migration history used by drizzle-kit migrate in drizzle.config.ts.
    await client.query(`
      CREATE TABLE public.__drizzle_migrations (
        id serial PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
    for (const migration of migrations) {
      for (const statement of migration.sql) {
        await client.query(statement);
      }
      await client.query(
        "INSERT INTO public.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
        [migration.hash, migration.folderMillis],
      );
    }

    await client.query("COMMIT");
    console.log(`Reset ${database} and applied ${migrations.length} migration(s).`);
  } finally {
    // Closing an open transaction rolls back the reset if any statement failed.
    await client.end();
  }
}

try {
  await resetDatabase();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
