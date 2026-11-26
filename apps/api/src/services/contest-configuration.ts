import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { categories, contests, evaluationScores, judgingRounds, scoringCriteria } from "../db/schema";
import type { ContestAward, ContestRound } from "../db/schemas/module-3.schema";
import { AppError } from "../utils/errors";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Schedule = Pick<typeof contests.$inferSelect,
  "startAt" | "endAt" | "judgingStartAt" | "judgingDeadlineAt" | "publishedAt">;
export type Settings = Partial<Pick<typeof contests.$inferInsert,
  "theme" | "rules" | "coverImageUrl" | "rounds" | "awards">>;
export type Criterion = Pick<typeof scoringCriteria.$inferInsert,
  "name" | "description" | "weight" | "maxScore" | "sortOrder">;
export type CategoryInput = Pick<typeof categories.$inferInsert, "name" | "description" | "isActive" | "requireNegativeProof">;
export type CategoryConfig = CategoryInput & { criteria: Criterion[] };

export const scheduleFields = {
  registrationStartAt: "startAt",
  submissionDeadlineAt: "endAt",
  judgingStartAt: "judgingStartAt",
  judgingDeadlineAt: "judgingDeadlineAt",
  publishedAt: "publishedAt",
} as const;

export function validateSchedule(schedule: Schedule) {
  const times = Object.values(scheduleFields).map((key) => schedule[key]?.getTime());
  if (times.some((time, index) => time === undefined || (index > 0 && time <= times[index - 1]!))) {
    throw AppError.badRequest("MSG008: Five strictly ordered contest milestones are required.");
  }
}

export function isClosed(status: string) {
  return ["judging", "in_judging", "published", "results_published", "completed", "archived", "cancelled"]
    .includes(status.toLowerCase());
}

async function ownedContest(tx: Transaction, id: string, organizerId: string, editable: boolean) {
  const [contest] = await tx.select().from(contests)
    .where(and(eq(contests.id, id), eq(contests.isDeleted, false))).for("update");
  if (!contest) throw AppError.notFound("Contest not found");
  if (contest.createdBy !== organizerId) throw AppError.forbidden("MSG005: You do not manage this contest");
  if (editable && (isClosed(contest.status) || (contest.judgingStartAt && contest.endAt && contest.endAt <= new Date()))) {
    throw AppError.forbidden("Contest configuration is closed");
  }
  return contest;
}

async function contestCategory(tx: Transaction, contestId: string, categoryId: string) {
  const [category] = await tx.select().from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.contestId, contestId)));
  if (!category) throw AppError.notFound("Category does not belong to this contest");
  return category;
}

async function readCriteria(tx: Transaction, categoryId: string) {
  return tx.select().from(scoringCriteria).where(eq(scoringCriteria.categoryId, categoryId))
    .orderBy(asc(scoringCriteria.sortOrder), asc(scoringCriteria.id));
}

async function insertCategory(tx: Transaction, contestId: string, input: CategoryInput) {
  const [created] = await tx.insert(categories).values({ ...input, contestId }).onConflictDoNothing()
    .returning();
  if (!created) throw AppError.conflict("Category name already exists in this contest");
  return created;
}

async function insertCriteria(tx: Transaction, categoryId: string, criteria: Criterion[]) {
  if (criteria.length === 0) return [];
  return tx.insert(scoringCriteria).values(criteria.map((criterion) => ({ ...criterion, categoryId }))).returning();
}

export async function createConfiguredContest(
  input: Schedule & Settings & { name: string; description: string | null; createdBy: string },
  sections: CategoryConfig[],
) {
  validateSchedule(input);
  return db.transaction(async (tx) => {
    const [contest] = await tx.insert(contests).values({ ...input, status: "DRAFT" }).returning();
    for (const { criteria, ...section } of sections) {
      const category = await insertCategory(tx, contest.id, section);
      await insertCriteria(tx, category.id, criteria);
    }
    return contestDto(contest);
  });
}

export async function duplicateContest(id: string, ownerId: string, schedule: Schedule, name?: string) {
  validateSchedule(schedule);
  return db.transaction(async (tx) => {
    const source = await ownedContest(tx, id, ownerId, false);
    const [copy] = await tx.insert(contests).values({
      ...schedule,
      name: name ?? `${source.name.slice(0, 139)} (bản sao)`,
      description: source.description,
      theme: source.theme,
      rules: source.rules,
      coverImageUrl: source.coverImageUrl,
      rounds: source.rounds,
      awards: source.awards,
      createdBy: ownerId,
      status: "DRAFT",
    }).returning();
    const sections = await tx.select().from(categories).where(eq(categories.contestId, id));
    for (const { id: sectionId, name, description, isActive, requireNegativeProof } of sections) {
      const section = await insertCategory(tx, copy.id, { name, description, isActive, requireNegativeProof });
      const criteria = await readCriteria(tx, sectionId);
      await insertCriteria(tx, section.id, criteria.map(({ name, description, weight, maxScore, sortOrder }) => ({
        name, description, weight, maxScore, sortOrder,
      })));
    }
    const sourceRounds = await tx.select().from(judgingRounds).where(eq(judgingRounds.contestId, id));
    const offset = schedule.judgingStartAt!.getTime() - source.judgingStartAt!.getTime();
    for (const round of sourceRounds) {
      const startAt = new Date(round.startAt.getTime() + offset);
      const deadlineAt = new Date(round.deadlineAt.getTime() + offset);
      if (deadlineAt > schedule.judgingDeadlineAt!) {
        throw AppError.badRequest("MSG008: Copied rounds do not fit the new judging window");
      }
      await tx.insert(judgingRounds).values({
        contestId: copy.id, name: round.name, position: round.position,
        advanceCount: round.advanceCount, requiredJudges: round.requiredJudges, startAt, deadlineAt,
      });
    }
    return contestDto(copy);
  });
}

export async function saveCategory(id: string, ownerId: string, input: Partial<CategoryInput>, categoryId?: string) {
  return db.transaction(async (tx) => {
    await ownedContest(tx, id, ownerId, true);
    if (!categoryId) {
      if (!input.name) throw AppError.badRequest("Category name is required");
      return insertCategory(tx, id, { ...input, name: input.name });
    }

    await contestCategory(tx, id, categoryId);
    if (input.name !== undefined) {
      const [existing] = await tx.select({ id: categories.id }).from(categories)
        .where(and(eq(categories.contestId, id), eq(categories.name, input.name)));
      if (existing && existing.id !== categoryId) throw AppError.conflict("Category name already exists in this contest");
    }
    const [updated] = await tx.update(categories).set({ ...input, updatedAt: new Date() })
      .where(and(eq(categories.id, categoryId), eq(categories.contestId, id))).returning();
    return updated;
  });
}

export async function categoryCriteria(id: string, categoryId: string, ownerId: string, replacement?: Criterion[]) {
  return db.transaction(async (tx) => {
    await ownedContest(tx, id, ownerId, replacement !== undefined);
    await contestCategory(tx, id, categoryId);
    if (!replacement) return readCriteria(tx, categoryId);

    const [used] = await tx.select({ id: evaluationScores.id }).from(evaluationScores)
      .innerJoin(scoringCriteria, eq(evaluationScores.criterionId, scoringCriteria.id))
      .where(eq(scoringCriteria.categoryId, categoryId)).limit(1);
    if (used) throw AppError.conflict("Criteria already used for scoring cannot be replaced");
    await tx.delete(scoringCriteria).where(eq(scoringCriteria.categoryId, categoryId));
    return insertCriteria(tx, categoryId, replacement);
  });
}

export function contestDto<T extends Schedule & { status: string }>(contest: T, now = new Date()) {
  const { startAt, endAt, judgingStartAt, judgingDeadlineAt, publishedAt } = contest;
  let status = contest.status;
  if (startAt && endAt && judgingStartAt && judgingDeadlineAt && publishedAt &&
      ["scheduled", "open", "ongoing", "verifying", "under_review"].includes(status.toLowerCase())) {
    status = now < startAt ? "SCHEDULED" : now < endAt ? "OPEN" : "VERIFYING";
  }
  if (judgingStartAt && status.toLowerCase() === "judging") status = "IN_JUDGING";
  if (judgingStartAt && status.toLowerCase() === "published") status = "RESULTS_PUBLISHED";
  const { isDeleted: _isDeleted, ...data } = contest as T & { isDeleted?: boolean };
  return { ...data, status, registrationStartAt: startAt, submissionDeadlineAt: endAt };
}

export type { ContestAward, ContestRound };
