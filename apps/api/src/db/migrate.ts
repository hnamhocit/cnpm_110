import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";
import { seed } from "./seed";

try {
  await migrate(db, {
    migrationsFolder: "./drizzle",
    migrationsSchema: "public",
    migrationsTable: "__drizzle_migrations",
  });
  await seed();
  console.log("Database synchronized and seed completed.");
} finally {
  await pool.end();
}
