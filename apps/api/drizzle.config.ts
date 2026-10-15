
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
const command = process.argv.join(" ");
const isGenerate = command.includes("generate");

if (!databaseUrl && !isGenerate) {
  throw new Error(
    "Missing DATABASE_URL environment variable. Configure it in apps/api/.env",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      databaseUrl ??
      "postgresql://postgres:postgres@localhost:5432/film_contest",
  },
  migrations: {
    schema: "public",
    table: "__drizzle_migrations",
  },
  strict: true,
  verbose: true,
});
