import { eq } from "drizzle-orm";
import { db } from "../index";
import { roles, users, userRoles } from "../schema";

const DEFAULT_ROLES = [
  { name: "Admin", description: "System administrator" },
  { name: "Organizer", description: "Competition organizer" },
  { name: "Judge", description: "Competition judge" },
  { name: "Participant", description: "Competition participant" },
] as const;

type RoleName = (typeof DEFAULT_ROLES)[number]["name"];

const TEST_ACCOUNTS: {
  fullName: string;
  email: string;
  roleName: RoleName;
}[] = [
    {
      fullName: "Quản Trị Viên Hệ Thống",
      email: "admin.test@example.com",
      roleName: "Admin",
    },
    {
      fullName: "Ban Tổ Chức Thử Nghiệm",
      email: "organizer.test@example.com",
      roleName: "Organizer",
    },
    {
      fullName: "Nguyễn Văn Thí Sinh",
      email: "participant.test@example.com",
      roleName: "Participant",
    },
  ];

export async function seedRoles() {
  await db.insert(roles).values([...DEFAULT_ROLES]).onConflictDoNothing({
    target: roles.name,
  });

  const allRoles = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles);

  return new Map(allRoles.map((r) => [r.name, r.id]));
}

export async function seedUsers(
  roleMap: Map<string, string>,
) {
  const userIdsByRole = new Map<RoleName, string>();
  let sharedPasswordHash: string | null = null;

  for (const acc of TEST_ACCOUNTS) {
    const roleId = roleMap.get(acc.roleName);
    if (!roleId) continue;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, acc.email))
      .limit(1);

    let userId = existing?.id;

    if (!userId) {
      if (!sharedPasswordHash) {
        sharedPasswordHash = await Bun.password.hash("password123");
      }

      const [inserted] = await db
        .insert(users)
        .values({
          fullName: acc.fullName,
          email: acc.email,
          passwordHash: sharedPasswordHash,
          isActive: true,
        })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id });

      userId = inserted?.id;
    }

    if (userId) {
      await db
        .insert(userRoles)
        .values({ userId, roleId })
        .onConflictDoNothing();

      userIdsByRole.set(acc.roleName, userId);
    }
  }

  console.log("[Seed] Vai trò: Admin, Organizer, Judge, Participant");
  console.log("[Seed] Tài khoản: admin.test@example.com (Admin), organizer.test@example.com (Organizer), participant.test@example.com (Participant)");
  return userIdsByRole;
}

