import { db, pool } from "./index";
import { roles, users, userRoles, contests, categories, scoringCriteria, submissions } from "./schema";
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

export async function seed() {
  try {
    await db.insert(roles).values(defaultRoles).onConflictDoNothing({
      target: roles.name,
    });

    console.log("Default roles seeded successfully.");

    // 0. Seed test Admin account: admin.test@example.com / password123
    const adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, "Admin"),
    });

    if (adminRole) {
      const passwordHash = await Bun.password.hash("password123");
      const [insertedAdmin] = await db
        .insert(users)
        .values({
          fullName: "Quản Trị Viên Hệ Thống",
          email: "admin.test@example.com",
          passwordHash,
          isActive: true,
        })
        .onConflictDoNothing({ target: users.email })
        .returning();

      const adminUserId =
        insertedAdmin?.id ??
        (
          await db.query.users.findFirst({
            where: eq(users.email, "admin.test@example.com"),
          })
        )?.id;

      if (adminUserId) {
        await db
          .insert(userRoles)
          .values({
            userId: adminUserId,
            roleId: adminRole.id,
          })
          .onConflictDoNothing();
        console.log("Test admin account ready: admin.test@example.com / password123");
      }
    }

    // 1. Seed test Organizer account: organizer.test@example.com / password123
    const organizerRole = await db.query.roles.findFirst({
      where: eq(roles.name, "Organizer"),
    });

    let organizerUserId: string | undefined;

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

      organizerUserId =
        insertedUser?.id ??
        (
          await db.query.users.findFirst({
            where: eq(users.email, "organizer.test@example.com"),
          })
        )?.id;

      if (organizerUserId) {
        await db
          .insert(userRoles)
          .values({
            userId: organizerUserId,
            roleId: organizerRole.id,
          })
          .onConflictDoNothing();
        console.log("Test organizer account ready: organizer.test@example.com / password123");
      }
    }

    // 2. Seed test Participant account: participant.test@example.com / password123
    const participantRole = await db.query.roles.findFirst({
      where: eq(roles.name, "Participant"),
    });

    let participantUserId: string | undefined;

    if (participantRole) {
      const passwordHash = await Bun.password.hash("password123");
      const [insertedUser] = await db
        .insert(users)
        .values({
          fullName: "Nguyễn Văn Thí Sinh",
          email: "participant.test@example.com",
          passwordHash,
          isActive: true,
        })
        .onConflictDoNothing({ target: users.email })
        .returning();

      participantUserId =
        insertedUser?.id ??
        (
          await db.query.users.findFirst({
            where: eq(users.email, "participant.test@example.com"),
          })
        )?.id;

      if (participantUserId) {
        await db
          .insert(userRoles)
          .values({
            userId: participantUserId,
            roleId: participantRole.id,
          })
          .onConflictDoNothing();
        console.log("Test participant account ready: participant.test@example.com / password123");
      }
    }

    if (!organizerUserId || !participantUserId) {
      console.warn("Could not find organizer or participant ID, skipping contest seed.");
      return;
    }

    // 3. Seed Contest 1: Cuộc thi đang diễn ra (Ongoing Contest)
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [ongoingContest] = await db
      .insert(contests)
      .values({
        name: "Sắc Màu Phim Analog 2026 - Mùa 1",
        description: "Cuộc thi nhiếp ảnh phim thường niên nhằm tôn vinh những tác phẩm giàu tương phản, đậm chất hạt phim analog nguyên bản. Tiếp nhận các thể loại ảnh đường phố, phong cảnh và chân dung.",
        startAt: oneMonthAgo,
        endAt: oneMonthLater,
        status: "ongoing",
        createdBy: organizerUserId,
      })
      .returning();

    console.log("Ongoing contest seeded:", ongoingContest.name);

    // Categories for Contest 1
    const [catStreet] = await db
      .insert(categories)
      .values({
        contestId: ongoingContest.id,
        name: "Nhiếp ảnh Đường phố 35mm",
        description: "Ảnh chụp đời thường ghi lại nhịp sống bằng phim 35mm khổ 135.",
      })
      .returning();

    const [catLandscape] = await db
      .insert(categories)
      .values({
        contestId: ongoingContest.id,
        name: "Phong cảnh Medium Format 120",
        description: "Tác phẩm phong cảnh sử dụng máy cơ phim cuộn 120 (6x6, 6x7, 645).",
      })
      .returning();

    // Scoring Criteria
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

    // Submissions for Contest 1
    await db.insert(submissions).values([
      {
        contestId: ongoingContest.id,
        categoryId: catStreet.id,
        participantId: participantUserId,
        title: "Hà Nội Chiều Mưa Phố Cổ",
        description: "Chụp trên phim Kodak Tri-X 400 bằng máy Leica M3 và ống kính 50mm f/2 Summicron.",
        imageOriginalPath: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop",
        imagePreviewPath: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600&auto=format&fit=crop",
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
        description: "Chụp trên phim Fujifilm Pro 400H bằng máy Hasselblad 500C/M.",
        imageOriginalPath: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
        imagePreviewPath: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
        fileSizeBytes: 3120000n,
        width: 3000,
        height: 3000,
        status: "PENDING_AI",
      },
    ]);

    // 4. Seed Contest 2: Cuộc thi đã kết thúc (Published Contest for Winners Showcase & Archive)
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [publishedContest] = await db
      .insert(contests)
      .values({
        name: "Khoảnh Khắc Di Sản Việt Nam 2025",
        description: "Triển lãm và tôn vinh những di sản văn hóa, con người Việt Nam qua lăng kính nhiếp ảnh phim analog truyền thống.",
        startAt: twoMonthsAgo,
        endAt: oneWeekAgo,
        status: "published",
        createdBy: organizerUserId,
      })
      .returning();

    const [catHeritage] = await db
      .insert(categories)
      .values({
        contestId: publishedContest.id,
        name: "Di Sản Văn Hóa & Lễ Hội",
        description: "Ảnh màu và đen trắng về di tích, con người và làng nghề.",
      })
      .returning();

    await db.insert(submissions).values([
      {
        contestId: publishedContest.id,
        categoryId: catHeritage.id,
        participantId: participantUserId,
        title: "Nắng Sớm Làng Chài Cổ Thạch",
        description: "Chụp bằng máy Nikon FM2n, phim Kodak Portra 160. Tác phẩm đạt Giải Nhất chung cuộc.",
        imageOriginalPath: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
        imagePreviewPath: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
        fileSizeBytes: 2890000n,
        width: 3200,
        height: 2133,
        status: "APPROVED",
      },
    ]);

    console.log("Published contest & submissions seeded successfully!");
  } finally {
    await pool.end();
  }
}
