import { db, pool } from "./index";
import { roles } from "./schema";

const defaultRoles = [
  {
    name: "Admin",
    description: "System administrator",
  },
  {
    name: "Organizer",
    description: "Competition organizer",
  },
  {
    name: "Judge",
    description: "Competition judge",
  },
  {
    name: "Participant",
    description: "Competition participant",
  },
];

async function seed() {
  try {
    await db.insert(roles).values(defaultRoles).onConflictDoNothing({
      target: roles.name,
    });

    console.log("Default roles seeded successfully.");
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Failed to seed default roles:", error);
  process.exitCode = 1;
});
