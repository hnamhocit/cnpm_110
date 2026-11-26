import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  categories, contestJudges, contests, judgingRoundEntries, judgingRounds,
  roles, submissions, userRoles, users,
} from "../db/schema";
import { AppError } from "../utils/errors";

export type RoundConfig = Pick<typeof judgingRounds.$inferInsert,
  "name" | "position" | "startAt" | "deadlineAt" | "advanceCount" | "requiredJudges">;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function ownedContest(tx: Transaction, contestId: string, ownerId: string) {
  const [contest] = await tx.select().from(contests)
    .where(and(eq(contests.id, contestId), eq(contests.isDeleted, false))).for("update");
  if (!contest) throw AppError.notFound("Contest not found");
  if (contest.createdBy !== ownerId) throw AppError.forbidden("MSG005: You do not manage this contest");
  return contest;
}

function assertMutable(contest: typeof contests.$inferSelect) {
  if (["published", "results_published", "completed", "archived", "cancelled"].includes(contest.status.toLowerCase())) {
    throw AppError.conflict("Contest judging configuration is closed");
  }
}

function roundsForContest(tx: Transaction, contestId: string) {
  return tx.select().from(judgingRounds).where(eq(judgingRounds.contestId, contestId))
    .orderBy(asc(judgingRounds.position));
}

function roundById(rounds: (typeof judgingRounds.$inferSelect)[], roundId: string) {
  const round = rounds.find((item) => item.id === roundId);
  if (!round) throw AppError.notFound("Round does not belong to this contest");
  return round;
}

export function listJudgingRounds(contestId: string, ownerId: string) {
  return db.transaction(async (tx) => {
    await ownedContest(tx, contestId, ownerId);
    return roundsForContest(tx, contestId);
  });
}

export function saveJudgingRound(contestId: string, ownerId: string, input: Partial<RoundConfig>, roundId?: string) {
  return db.transaction(async (tx) => {
    const contest = await ownedContest(tx, contestId, ownerId);
    assertMutable(contest);
    const rounds = await roundsForContest(tx, contestId);
    const current = roundId ? roundById(rounds, roundId) : undefined;
    if (current?.lockedAt) throw AppError.conflict("Locked round configuration cannot change");
    if (current?.startedAt && Object.keys(input).some((key) => key !== "advanceCount")) {
      throw AppError.conflict("Only the advancement limit can change after the round starts");
    }

    const config = { ...current, ...input };
    if (!config.name || !config.position || !config.startAt || !config.deadlineAt ||
        config.advanceCount === undefined) throw AppError.badRequest("Missing round configuration");
    if (!contest.judgingStartAt || !contest.judgingDeadlineAt ||
        config.startAt < contest.judgingStartAt || config.deadlineAt > contest.judgingDeadlineAt ||
        config.startAt >= config.deadlineAt) {
      throw AppError.badRequest("MSG008: Round must be within the contest judging window");
    }
    const plan = [...rounds.filter(({ id }) => id !== roundId), config].sort((a, b) => a.position! - b.position!);
    for (let index = 1; index < plan.length; index++) {
      const before = plan[index - 1];
      const after = plan[index];
      if (before.position === after.position || before.deadlineAt! > after.startAt! || before.advanceCount === null) {
        throw AppError.badRequest("MSG008: Round dates must follow their order and only the last round may be final");
      }
    }
    if (current) {
      const [updated] = await tx.update(judgingRounds).set(input).where(eq(judgingRounds.id, current.id)).returning();
      return updated;
    }
    const [created] = await tx.insert(judgingRounds).values({
      contestId, name: config.name, position: config.position, startAt: config.startAt,
      deadlineAt: config.deadlineAt, advanceCount: config.advanceCount, requiredJudges: config.requiredJudges,
    }).returning();
    return created;
  });
}

function activeJudges(tx: Transaction, contestId: string, roundId: string) {
  return tx.select({ id: contestJudges.id, categoryId: contestJudges.categoryId, judgeId: contestJudges.judgeId, roundId: contestJudges.roundId })
    .from(contestJudges)
    .innerJoin(users, and(eq(users.id, contestJudges.judgeId), eq(users.isActive, true), eq(users.isBanned, false)))
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, and(eq(roles.id, userRoles.roleId), eq(roles.name, "Judge")))
    .where(and(eq(contestJudges.contestId, contestId), eq(contestJudges.roundId, roundId), eq(contestJudges.isActive, true)));
}

export function listRoundJudges(contestId: string, ownerId: string, roundId: string) {
  return db.transaction(async (tx) => {
    await ownedContest(tx, contestId, ownerId);
    roundById(await roundsForContest(tx, contestId), roundId);
    return activeJudges(tx, contestId, roundId);
  });
}

export function assignRoundJudge(contestId: string, ownerId: string, roundId: string, categoryId: string, judgeId: string) {
  return db.transaction(async (tx) => {
    const contest = await ownedContest(tx, contestId, ownerId);
    assertMutable(contest);
    const round = roundById(await roundsForContest(tx, contestId), roundId);
    if (round.startedAt || round.lockedAt) throw AppError.conflict("Judge assignments are frozen once the round starts");

    const [category] = await tx.select({ id: categories.id }).from(categories)
      .where(and(eq(categories.contestId, contestId), eq(categories.id, categoryId), eq(categories.isActive, true)));
    if (!category) throw AppError.notFound("Active category does not belong to this contest");

    const [judge] = await tx.select({ id: users.id }).from(users).innerJoin(userRoles, eq(userRoles.userId, users.id))
      .innerJoin(roles, and(eq(roles.id, userRoles.roleId), eq(roles.name, "Judge")))
      .where(and(eq(users.id, judgeId), eq(users.isActive, true), eq(users.isBanned, false)));
    if (!judge) throw AppError.badRequest("An active Judge account is required");

    const [entrant] = await tx.select({ id: submissions.id }).from(submissions)
      .where(and(eq(submissions.contestId, contestId), eq(submissions.participantId, judgeId))).limit(1);
    if (entrant || judgeId === contest.createdBy) throw AppError.conflict("BR-21: Judge has a conflicting role in this contest");

    const [existing] = await tx.select().from(contestJudges).where(and(
      eq(contestJudges.roundId, roundId), eq(contestJudges.categoryId, categoryId),
      eq(contestJudges.judgeId, judgeId), eq(contestJudges.isActive, true),
    ));
    if (existing) return existing;
    const [assignment] = await tx.insert(contestJudges).values({
      contestId, categoryId, roundId, judgeId, assignedBy: ownerId,
    }).returning();
    return assignment;
  });
}

export function startJudgingRound(contestId: string, ownerId: string, roundId: string) {
  return db.transaction(async (tx) => {
    const contest = await ownedContest(tx, contestId, ownerId);
    assertMutable(contest);
    if (!["scheduled", "open", "ongoing", "under_review", "judging"].includes(contest.status.toLowerCase())) {
      throw AppError.conflict("Contest has not opened for competition");
    }

    const rounds = await roundsForContest(tx, contestId);
    const round = roundById(rounds, roundId);
    if (round.lockedAt) throw AppError.conflict("The round is locked");
    if (round.startedAt) return round;
    if (rounds[rounds.length - 1].advanceCount !== null) throw AppError.conflict("The last round must be configured as final");
    if (rounds.some((item) => item.position < round.position && !item.lockedAt)) {
      throw AppError.conflict("Earlier rounds must be locked");
    }

    const now = new Date();
    if (now < round.startAt || now >= round.deadlineAt) throw AppError.conflict("The round is outside its judging window");
    const activeCategories = await tx.select({ id: categories.id }).from(categories)
      .where(and(eq(categories.contestId, contestId), eq(categories.isActive, true)));
    const judges = await activeJudges(tx, contestId, roundId);
    if (!activeCategories.length || activeCategories.some(({ id }) =>
      judges.filter(({ categoryId }) => categoryId === id).length < round.requiredJudges)) {
      throw AppError.conflict("BR-20: Each active category needs enough active Judges for this round");
    }

    if (rounds[0].id === round.id) {
      const entries = await tx.select({ id: submissions.id }).from(submissions)
        .innerJoin(categories, and(eq(categories.id, submissions.categoryId), eq(categories.isActive, true)))
        .where(and(eq(submissions.contestId, contestId), eq(submissions.status, "APPROVED")));
      if (entries.length) {
        await tx.insert(judgingRoundEntries).values(entries.map(({ id }) => ({ roundId, submissionId: id })))
          .onConflictDoNothing();
      }
    }
    const [started] = await tx.update(judgingRounds).set({ startedAt: now })
      .where(eq(judgingRounds.id, roundId)).returning();
    await tx.update(contests).set({ status: "judging", updatedAt: now }).where(eq(contests.id, contestId));
    return started;
  });
}
