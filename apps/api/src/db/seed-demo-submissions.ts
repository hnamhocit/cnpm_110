import { and, eq, like } from "drizzle-orm";
import { db, pool } from "./index";
import { categories, contests, filmMetadata, roles, submissionAiAnalyses, submissions, userRoles, users } from "./schema";
import { seed } from "./seed";

const demoName = "CINEGEN Demo · Theo dõi bài dự thi";
const statuses = ["PENDING_AI", "VERIFIED", "SUSPICIOUS", "FLAGGED", "APPROVED", "DISQUALIFIED"] as const;
const photoIds = [
  "1528127269322-539801943592",
  "1506744038136-46273834b3fb",
  "1507525428034-b723cf961d3e",
];

try {
  const database = new URL(Bun.env.DATABASE_URL ?? "");
  if (
    Bun.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) ||
    database.pathname !== "/cinegen_demo"
  ) {
    throw new Error("Demo seed requires the local cinegen_demo database");
  }

  await seed();
  const added = await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: contests.id }).from(contests).where(eq(contests.name, demoName));
    if (existing) return 0;

    const [organizer] = await tx.select({ id: users.id }).from(users)
      .where(eq(users.email, "organizer.test@example.com"));
    const [participant] = await tx.select({ id: users.id }).from(users)
      .where(eq(users.email, "participant.test@example.com"));
    const [role] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.name, "Participant"));
    if (!organizer || !participant || !role) throw new Error("Missing demo accounts or roles");

    const passwordHash = await Bun.password.hash("password123");
    const otherParticipants = await tx.insert(users).values(
      Array.from({ length: 5 }, (_, index) => ({
        fullName: `Thí sinh Demo ${index + 2}`,
        email: `participant.demo${index + 2}@example.com`,
        passwordHash,
      })),
    ).returning({ id: users.id });
    await tx.insert(userRoles).values(otherParticipants.map(({ id }) => ({ userId: id, roleId: role.id })));

    const now = Date.now();
    const [contest] = await tx.insert(contests).values({
      name: demoName,
      description: "Dữ liệu giả lập để trình diễn việc duyệt bài, theo dõi trạng thái và phân quyền thí sinh.",
      status: "ongoing",
      startAt: new Date(now - 7 * 86_400_000),
      endAt: new Date(now + 14 * 86_400_000),
      createdBy: organizer.id,
    }).returning({ id: contests.id });

    const sections = await tx.insert(categories).values(
      ["Đường phố", "Phong cảnh", "Đời thường"].map((name) => ({ contestId: contest.id, name })),
    ).returning({ id: categories.id });

    const entries = [participant, ...otherParticipants].flatMap(({ id: participantId }, personIndex) =>
      Array.from({ length: 12 }, (_, index) => {
        const status = statuses[index % statuses.length];
        const photo = `https://images.unsplash.com/photo-${photoIds[(index + personIndex) % photoIds.length]}`;
        const title = index === 0
          ? personIndex === 0 ? "DEMO · Bài chờ Organizer duyệt" : `DEMO · Bài riêng tư thí sinh ${personIndex + 1}`
          : `DEMO · Thí sinh ${personIndex + 1} · Tác phẩm ${index + 1}`;
        const id = crypto.randomUUID();
        const createdAt = new Date(now - index * 3_600_000);
        return {
          submission: {
            id, participantId, contestId: contest.id, categoryId: sections[index % sections.length].id,
            title, status, description: "Tác phẩm và metadata giả lập phục vụ demo.",
            rejectionReason: status === "DISQUALIFIED" ? "Ảnh có dấu hiệu nhận diện tác giả, không đáp ứng thể lệ chấm ẩn danh." : null,
            imageOriginalPath: `${photo}?w=2400&auto=format&fit=crop`,
            imagePreviewPath: `${photo}?w=640&auto=format&fit=crop`,
            width: 3000, height: 2000, fileSizeBytes: 2_400_000n,
            createdAt, updatedAt: createdAt,
          },
          metadata: {
            submissionId: id, filmBrand: "Kodak", filmStock: "Portra 400",
            filmFormat: "135", isoRated: 400, isoShot: 400, cameraBody: "Nikon FM2",
            lens: "50mm f/1.8", rollId: `ROLL-DEMO-${personIndex + 1}`,
            frameNumber: String(index + 1), devLabName: "Lab demo", scannerModel: "Noritsu",
          },
        };
      }),
    );
    await tx.insert(submissions).values(entries.map(({ submission }) => submission));
    await tx.insert(filmMetadata).values(entries.map(({ metadata }) => metadata));
    return entries.length;
  });

  const demoEntries = await db.select({
    id: submissions.id,
    title: submissions.title,
    status: submissions.status,
    preview: submissions.imagePreviewPath,
  }).from(submissions).innerJoin(contests, eq(contests.id, submissions.contestId))
    .where(and(eq(contests.name, demoName), like(submissions.title, "DEMO · %")));

  const sampleReports = demoEntries.flatMap((entry) => {
    const flagged = entry.status === "FLAGGED";
    if ((!flagged && entry.status !== "SUSPICIOUS") || !entry.preview) return [];
    const match = demoEntries.find((other) => other.id !== entry.id && other.preview === entry.preview);
    return [{
      submissionId: entry.id,
      aiGeneratedProbability: flagged ? "0.9100" : "0.5800",
      isAiFlagged: flagged,
      duplicateSuspectId: match?.id ?? null,
      duplicateSimilarityScore: match ? "1.0000" : null,
      predictedTags: [{ tag: "Phong cảnh", confidence: 0.94 }, { tag: "Ảnh ngoài trời", confidence: 0.87 }],
      flagReasons: ["DEMO_FIXTURE"],
    }];
  });
  if (sampleReports.length > 0) {
    const inserted = await db.insert(submissionAiAnalyses).values(sampleReports)
      .onConflictDoNothing({ target: submissionAiAnalyses.submissionId })
      .returning({ id: submissionAiAnalyses.id });
    console.log(`Added ${inserted.length} demo-only AI comparison reports.`);
  }

  console.log(added ? `Added ${added} demo submissions.` : "Demo submissions already exist.");
} finally {
  await pool.end();
}
