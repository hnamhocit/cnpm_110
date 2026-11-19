import { db, pool } from "./index";
import { roles, users, userRoles } from "./schema";
import { eq } from "drizzle-orm";

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

    // Seed test Organizer account: organizer.test@example.com / password123
    const organizerRole = await db.query.roles.findFirst({
      where: eq(roles.name, "Organizer"),
    });

    if (organizerRole) {
      const passwordHash = await Bun.password.hash("password123");
      const [insertedUser] = await db
        .insert(users)
        .values({
          fullName: "Ban Tổ Chức Thử Nghiệm",
          email: "organizer.test@example.com",
          passwordHash,
          isActive: true,
        })
        .onConflictDoNothing({ target: users.email })
        .returning();

      const targetUserId =
        insertedUser?.id ??
        (
          await db.query.users.findFirst({
            where: eq(users.email, "organizer.test@example.com"),
          })
        )?.id;

      if (targetUserId) {
        await db
          .insert(userRoles)
          .values({
            userId: targetUserId,
            roleId: organizerRole.id,
          })
          .onConflictDoNothing();
        console.log("Test organizer account seeded: organizer.test@example.com / password123");
      }
    }
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Failed to seed database:", error);
  process.exitCode = 1;
});
