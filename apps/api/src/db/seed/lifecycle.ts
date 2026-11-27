import { env } from "../../config/env";
import { eq, inArray, sql } from "drizzle-orm";
import { db, pool } from "../index";
import { categories, contestJudges, contests, judgingRounds, roles, scoringCriteria, userRoles, users } from "../schema";

const aliases = ["O1", "O2", "J1", "J2", "P1", "P2", "C1", "C2", "C3", "CAT1", "CAT2", "R1", "R2", "K1", "K2", "K3"] as const;
export const lifecycleIds = Object.fromEntries(aliases.map((alias, index) => [
  alias, `1fec0000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
])) as Record<(typeof aliases)[number], string>;
const ids = lifecycleIds;
const accounts = [["O1", "Organizer"], ["O2", "Organizer"], ["J1", "Judge"], ["J2", "Judge"], ["P1", "Participant"], ["P2", "Participant"]] as const;

/** UC-11–17/34: BR-08 schedules, BR-15 weights, BR-20/21 assignments. */
export async function seedLifecycle() {
  const url = new URL(env.databaseUrl);
  if (env.nodeEnv === "production" || !url || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Lifecycle seed requires a local non-production database");
  }
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('cinegen:seed:lifecycle'))`);
    const [existing] = await tx.select({ id: contests.id }).from(contests).where(eq(contests.id, ids.C1));
    if (existing) return; // Preserve changes made during manual acceptance.

    const now = Date.now();
    const day = 86_400_000;
    const at = (offset: number) => new Date(now + offset * day);
    const passwordHash = await Bun.password.hash("password123");
    await tx.insert(roles).values(["Organizer", "Judge", "Participant"].map((name) => ({ name })))
      .onConflictDoNothing({ target: roles.name });
    const roleIds = new Map((await tx.select().from(roles)).map((role) => [role.name, role.id]));
    await tx.insert(users).values(accounts.map(([alias]) => ({
      id: ids[alias], fullName: `Lifecycle ${alias}`,
      email: `lifecycle.${alias.toLowerCase()}@example.com`, passwordHash, emailVerifiedAt: new Date(now),
    })));
    await tx.insert(userRoles).values(accounts.map(([alias, role]) => ({ userId: ids[alias], roleId: roleIds.get(role)! })));
    await tx.insert(contests).values([
      { id: ids.C1, name: "Lifecycle · C1 · Đang mở đăng ký", status: "OPEN", startAt: at(-7), endAt: at(14), judgingStartAt: at(15), judgingDeadlineAt: at(21), publishedAt: at(22) },
      { id: ids.C2, name: "Lifecycle · C2 · Đã đóng đăng ký", status: "UNDER_REVIEW", startAt: at(-14), endAt: at(-1), judgingStartAt: at(1), judgingDeadlineAt: at(7), publishedAt: at(8) },
      { id: ids.C3, name: "Lifecycle · C3 · Bản nháp", status: "DRAFT", startAt: at(7), endAt: at(21), judgingStartAt: at(22), judgingDeadlineAt: at(28), publishedAt: at(29) },
    ].map((contest) => ({ ...contest, createdBy: ids.O1, rules: "Ảnh chụp bằng phim; mỗi tác phẩm tuân thủ thể lệ cuộc thi." })));
    await tx.insert(categories).values([
      { id: ids.CAT1, contestId: ids.C1, name: "CAT1 · Đang hoạt động", isActive: true },
      { id: ids.CAT2, contestId: ids.C1, name: "CAT2 · Vô hiệu hóa", isActive: false },
    ]);
    await tx.insert(scoringCriteria).values([
      { id: ids.K1, name: "K1 · Bố cục & Ánh sáng", weight: "0.4000", sortOrder: 1 },
      { id: ids.K2, name: "K2 · Chất cảm hạt phim", weight: "0.3000", sortOrder: 2 },
      { id: ids.K3, name: "K3 · Thông điệp & Cảm xúc", weight: "0.3000", sortOrder: 3 },
    ].map((criterion) => ({ ...criterion, categoryId: ids.CAT1, maxScore: "10.00" })));
    await tx.insert(judgingRounds).values([
      { id: ids.R1, name: "R1 · Sơ khảo", position: 1, startAt: at(15), deadlineAt: at(18), advanceCount: 10 },
      { id: ids.R2, name: "R2 · Chung khảo", position: 2, startAt: at(19), deadlineAt: at(21), advanceCount: null },
    ].map((round) => ({ ...round, contestId: ids.C1, requiredJudges: 2 })));
    await tx.insert(contestJudges).values([ids.R1, ids.R2].flatMap((roundId) => [ids.J1, ids.J2].map((judgeId) => ({
      contestId: ids.C1, categoryId: ids.CAT1, roundId, judgeId, assignedBy: ids.O1,
    }))));
  });
  console.log("[Seed] Tài khoản: lifecycle.{o1,o2,j1,j2,p1,p2}@example.com");
  console.log("[Seed] O1 quản lý C1/C2/C3; O2 là Organizer khác; J1/J2 chấm CAT1 ở R1/R2; P1/P2 là Participant");
  console.log("");
  for (const contest of await db.select().from(contests).where(inArray(contests.id, [ids.C1, ids.C2, ids.C3])).orderBy(contests.id)) {
    console.log(`[Seed] ${contest.name} | ${contest.status}`);
  }
  console.log("");
  for (const category of await db.select().from(categories).where(inArray(categories.id, [ids.CAT1, ids.CAT2])).orderBy(categories.id)) {
    console.log(`[Seed] ${category.name} | thuộc C1 | ${category.isActive ? "Hoạt động" : "Vô hiệu hóa"}`);
  }
  console.log("");
  for (const round of await db.select().from(judgingRounds).where(inArray(judgingRounds.id, [ids.R1, ids.R2])).orderBy(judgingRounds.position)) {
    console.log(`[Seed] ${round.name} | ${round.lockedAt ? "Đã khóa" : "Chưa khóa"}`);
  }
  console.log("");
  for (const criterion of await db.select().from(scoringCriteria).where(inArray(scoringCriteria.id, [ids.K1, ids.K2, ids.K3])).orderBy(scoringCriteria.sortOrder)) {
    console.log(`[Seed] ${criterion.name} | thuộc CAT1 | Trọng số=${Number(criterion.weight) * 100}%`);
  }
}

if (import.meta.main) {
  try { await seedLifecycle(); console.log("[Seed] Mật khẩu chung lúc khởi tạo: password123"); } finally { await pool.end(); }
}
