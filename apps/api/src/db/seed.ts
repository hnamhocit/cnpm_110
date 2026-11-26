import { eq } from "drizzle-orm";
import { db } from "./index";
import { seedDemoSubmissions } from "./seed-demo-submissions";
import {
  categories,
  contests,
  roles,
  scoringCriteria,
  submissions,
  userRoles,
  users,
} from "./schema";

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

async function seedRoles() {
  await db.insert(roles).values([...DEFAULT_ROLES]).onConflictDoNothing({
    target: roles.name,
  });

  const allRoles = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles);

  console.log("Default roles ready.");
  return new Map(allRoles.map((r) => [r.name, r.id]));
}

async function seedUsers(
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
      console.log(`Account ready: ${acc.email} / password123`);
    }
  }

  return userIdsByRole;
}

async function contestExistsByName(name: string): Promise<boolean> {
  const [found] = await db
    .select({ id: contests.id })
    .from(contests)
    .where(eq(contests.name, name))
    .limit(1);

  return Boolean(found);
}

async function seedOngoingContest(
  organizerUserId: string,
  participantUserId: string,
) {
  const contestName = "Sắc Màu Phim Analog 2026 - Mùa 1";
  if (await contestExistsByName(contestName)) {
    console.log(`Skipped (already exists): ${contestName}`);
    return;
  }

  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [ongoingContest] = await db
    .insert(contests)
    .values({
      name: contestName,
      description:
        "Cuộc thi nhiếp ảnh phim thường niên nhằm tôn vinh những tác phẩm giàu tương phản, đậm chất hạt phim analog nguyên bản. Tiếp nhận các thể loại ảnh đường phố, phong cảnh và chân dung.",
      startAt: oneMonthAgo,
      endAt: oneMonthLater,
      status: "ongoing",
      createdBy: organizerUserId,
    })
    .returning({ id: contests.id, name: contests.name });

  const [catStreet, catLandscape] = await db
    .insert(categories)
    .values([
      {
        contestId: ongoingContest.id,
        name: "Nhiếp ảnh Đường phố 35mm",
        description:
          "Ảnh chụp đời thường ghi lại nhịp sống bằng phim 35mm khổ 135.",
      },
      {
        contestId: ongoingContest.id,
        name: "Phong cảnh Medium Format 120",
        description:
          "Tác phẩm phong cảnh sử dụng máy cơ phim cuộn 120 (6x6, 6x7, 645).",
      },
    ])
    .returning({ id: categories.id });

  await db.insert(scoringCriteria).values([
    {
      categoryId: catStreet.id,
      name: "Bố cục & Ánh sáng",
      description: "Độ sắc nét, tương phản quang học và kiểm soát vùng sáng tối.",
      maxScore: "10.00",
      weight: "0.40",
      sortOrder: 1,
    },
    {
      categoryId: catStreet.id,
      name: "Chất cảm hạt phim (Grain)",
      description: "Độ mịn hoặc đặc trưng hạt của loại phim sử dụng.",
      maxScore: "10.00",
      weight: "0.30",
      sortOrder: 2,
    },
    {
      categoryId: catStreet.id,
      name: "Thông điệp & Cảm xúc",
      description: "Khoảnh khắc quyết định và chiều sâu câu chuyện tác phẩm.",
      maxScore: "10.00",
      weight: "0.30",
      sortOrder: 3,
    },
  ]);

  await db.insert(submissions).values([
    {
      contestId: ongoingContest.id,
      categoryId: catStreet.id,
      participantId: participantUserId,
      title: "Hà Nội Chiều Mưa Phố Cổ",
      description:
        "Chụp trên phim Kodak Tri-X 400 bằng máy Leica M3 và ống kính 50mm f/2 Summicron.",
      imageOriginalPath:
        "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop",
      imagePreviewPath:
        "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600&auto=format&fit=crop",
      fileSizeBytes: 2450000n,
      width: 3000,
      height: 2000,
      status: "APPROVED",
    },
    {
      contestId: ongoingContest.id,
      categoryId: catLandscape.id,
      participantId: participantUserId,
      title: "Sương Sớm Sapa Ruộng Bậc Thang",
      description:
        "Chụp trên phim Fujifilm Pro 400H bằng máy Hasselblad 500C/M.",
      imageOriginalPath:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
      imagePreviewPath:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
      fileSizeBytes: 3120000n,
      width: 3000,
      height: 3000,
      status: "PENDING_AI",
    },
  ]);

  console.log("Seeded:", ongoingContest.name);
}

async function seedPublishedContest(
  organizerUserId: string,
  participantUserId: string,
) {
  const contestName = "Khoảnh Khắc Di Sản Việt Nam 2025";
  if (await contestExistsByName(contestName)) {
    console.log(`Skipped (already exists): ${contestName}`);
    return;
  }

  const now = new Date();
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [publishedContest] = await db
    .insert(contests)
    .values({
      name: contestName,
      description:
        "Triển lãm và tôn vinh những di sản văn hóa, con người Việt Nam qua lăng kính nhiếp ảnh phim analog truyền thống.",
      startAt: twoMonthsAgo,
      endAt: oneWeekAgo,
      status: "published",
      createdBy: organizerUserId,
    })
    .returning({ id: contests.id, name: contests.name });

  const [catHeritage] = await db
    .insert(categories)
    .values({
      contestId: publishedContest.id,
      name: "Di Sản Văn Hóa & Lễ Hội",
      description: "Ảnh màu và đen trắng về di tích, con người và làng nghề.",
    })
    .returning({ id: categories.id });

  await db.insert(submissions).values({
    contestId: publishedContest.id,
    categoryId: catHeritage.id,
    participantId: participantUserId,
    title: "Nắng Sớm Làng Chài Cổ Thạch",
    description:
      "Chụp bằng máy Nikon FM2n, phim Kodak Portra 160. Tác phẩm đạt Giải Nhất chung cuộc.",
    imageOriginalPath:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    imagePreviewPath:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
    fileSizeBytes: 2890000n,
    width: 3200,
    height: 2133,
    status: "APPROVED",
  });

  console.log("Seeded:", publishedContest.name);
}

export async function seed() {
  const roleMap = await seedRoles();
  if (Bun.env.NODE_ENV === "production") return;
  const userIdsByRole = await seedUsers(roleMap);

  const organizerUserId = userIdsByRole.get("Organizer");
  const participantUserId = userIdsByRole.get("Participant");

  if (!organizerUserId || !participantUserId) {
    console.warn("Missing Organizer or Participant ID, skipping contest seed.");
    return;
  }

  await seedOngoingContest(organizerUserId, participantUserId);
  await seedPublishedContest(organizerUserId, participantUserId);

  const database = URL.parse(Bun.env.DATABASE_URL ?? "");
  if (database && ["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
    await seedDemoSubmissions();
  }
}
