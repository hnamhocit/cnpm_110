import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  categories, contestJudges, contestNotifications, contestPublications, contests,
  evaluations, evaluationScores, judgingRoundEntries, judgingRounds, scoringCriteria, submissions, users,
  type OfficialResultEntry, type ResultTieBreak,
} from "../db/schema";
import { AppError } from "../utils/errors";

function publicationDto(publication: typeof contestPublications.$inferSelect) {
  const { contestId, contestName, roundId, publishedAt, entries } = publication;
  return {
    contestId, contestName, roundId, publishedAt, status: "RESULTS_PUBLISHED", resultsLocked: true, entries,
    winners: entries.filter(({ award }) => award !== null).map((entry) => ({ ...entry, contestId, contestName })),
  };
}

export async function getOfficialContestResults(id: string) {
  const [publication] = await db.select().from(contestPublications).where(eq(contestPublications.contestId, id));
  if (!publication) throw AppError.notFound("Official results not found");
  return publicationDto(publication);
}

function weightedUnits(total: string) {
  const [whole, fraction = ""] = total.split(".");
  return BigInt(whole + fraction.padEnd(6, "0"));
}

export function publishContestResults(id: string, ownerId: string, tieBreaks: ResultTieBreak[]) {
  return db.transaction(async (tx) => {
    const [contest] = await tx.select().from(contests)
      .where(and(eq(contests.id, id), eq(contests.isDeleted, false))).for("update");
    if (!contest) throw AppError.notFound("Contest not found");
    if (contest.createdBy !== ownerId) throw AppError.forbidden("MSG005: You do not manage this contest");

    const [previous] = await tx.select().from(contestPublications).where(eq(contestPublications.contestId, id));
    if (previous) return publicationDto(previous);

    const now = new Date();
    if (!["judging", "in_judging"].includes(contest.status.toLowerCase()) ||
        !contest.publishedAt || now < contest.publishedAt) {
      throw AppError.conflict("Contest is not ready to publish results");
    }
    const [round] = await tx.select().from(judgingRounds).where(eq(judgingRounds.contestId, id))
      .orderBy(desc(judgingRounds.position)).limit(1);
    if (!round?.lockedAt || !round.startedAt || round.advanceCount !== null) {
      throw AppError.conflict("The final judging round must be locked");
    }

    const assignments = await tx.select().from(contestJudges)
      .where(and(eq(contestJudges.roundId, round.id), eq(contestJudges.isActive, true)));
    if (!assignments.length || assignments.some(({ lockedAt }) => !lockedAt)) {
      throw AppError.conflict("All required final-round scorecards must be locked");
    }
    const entries = await tx.select({
      submissionId: submissions.id,
      contestId: submissions.contestId,
      categoryId: submissions.categoryId,
      categoryName: categories.name,
      title: submissions.title,
      authorName: users.fullName,
      participantId: submissions.participantId,
      photoUrl: submissions.imagePreviewPath,
      proofPath: submissions.negativeProofPath,
      proofRequestedAt: submissions.proofRequestedAt,
      proofVerifiedAt: submissions.proofVerifiedAt,
      requireNegativeProof: categories.requireNegativeProof,
      status: submissions.status,
    }).from(judgingRoundEntries)
      .innerJoin(submissions, eq(submissions.id, judgingRoundEntries.submissionId))
      .innerJoin(categories, eq(categories.id, submissions.categoryId))
      .innerJoin(users, eq(users.id, submissions.participantId))
      .where(eq(judgingRoundEntries.roundId, round.id));
    if (!entries.length || entries.some((entry) => entry.contestId !== id || entry.status !== "APPROVED")) {
      throw AppError.conflict("The final round must contain approved submissions from this contest");
    }
    if (entries.some((entry) => (entry.requireNegativeProof || entry.proofRequestedAt || entry.proofPath) &&
        (!entry.proofVerifiedAt || !entry.proofPath))) {
      throw AppError.conflict("BR-06: Required proof must be verified before publication");
    }

    const weights = await tx.select({
      categoryId: scoringCriteria.categoryId,
      count: sql<number>`count(*)::int`,
      valid: sql<boolean>`sum(${scoringCriteria.weight}) = 1.0000`,
    }).from(scoringCriteria).innerJoin(categories, eq(categories.id, scoringCriteria.categoryId))
      .where(eq(categories.contestId, id)).groupBy(scoringCriteria.categoryId);
    const sheets = await tx.select({
      submissionId: evaluations.submissionId,
      judgeId: evaluations.judgeId,
      categoryId: scoringCriteria.categoryId,
      count: sql<number>`count(*)::int`,
      total: sql<string>`sum(${evaluationScores.score} * ${scoringCriteria.weight})`,
      valid: sql<boolean>`bool_and(${evaluationScores.score} <= ${scoringCriteria.maxScore})`,
    }).from(evaluations).innerJoin(evaluationScores, eq(evaluationScores.evaluationId, evaluations.id))
      .innerJoin(scoringCriteria, eq(scoringCriteria.id, evaluationScores.criterionId))
      .where(eq(evaluations.roundId, round.id))
      .groupBy(evaluations.submissionId, evaluations.judgeId, scoringCriteria.categoryId);

    const byCategory = new Map<string, (typeof entries[number] & { finalScore: number })[]>();
    for (const entry of entries) {
      const judges = assignments.filter(({ categoryId }) => categoryId === entry.categoryId);
      const criteria = weights.find(({ categoryId }) => categoryId === entry.categoryId);
      if (judges.length < round.requiredJudges || !criteria?.valid) {
        throw AppError.conflict("Missing required final-round judges or invalid criterion weights");
      }
      let total = 0n;
      for (const { judgeId } of judges) {
        const sheet = sheets.find((item) => item.submissionId === entry.submissionId &&
          item.judgeId === judgeId && item.categoryId === entry.categoryId);
        if (!sheet?.valid || sheet.count !== criteria.count) {
          throw AppError.conflict("A required final-round scorecard is incomplete");
        }
        total += weightedUnits(sheet.total);
      }
      const divisor = BigInt(judges.length) * 10_000n;
      const finalScore = Number((total + divisor / 2n) / divisor) / 100;
      const scored = { ...entry, finalScore };
      const group = byCategory.get(entry.categoryId);
      if (group) group.push(scored);
      else byCategory.set(entry.categoryId, [scored]);
    }

    const awards = [...contest.awards].sort((a, b) => a.rankOrder - b.rankOrder);
    if (awards.some((award, i) => i > 0 && awards[i - 1].rankOrder + awards[i - 1].quota > award.rankOrder)) {
      throw AppError.conflict("Configured awards have overlapping rank ranges");
    }
    const results: OfficialResultEntry[] = [];
    const usedTieBreaks = new Set<ResultTieBreak>();
    for (const [categoryId, group] of byCategory) {
      group.sort((a, b) => b.finalScore - a.finalScore);
      for (let start = 0; start < group.length;) {
        const score = group[start].finalScore;
        let end = start + 1;
        while (end < group.length && group[end].finalScore === score) end++;
        let tied = group.slice(start, end);
        if (tied.length > 1) {
          const decision = tieBreaks.find((item) => item.categoryId === categoryId &&
            item.submissionIds.length === tied.length && tied.every(({ submissionId }) => item.submissionIds.includes(submissionId)));
          if (!decision) throw AppError.conflict("BR-25: Confirm every tied rank group with a reason");
          usedTieBreaks.add(decision);
          tied = decision.submissionIds.map((submissionId) => tied.find((item) => item.submissionId === submissionId)!);
        }
        for (const [offset, entry] of tied.entries()) {
          const rank = start + offset + 1;
          const award = awards.find(({ rankOrder, quota }) => rank >= rankOrder && rank < rankOrder + quota);
          results.push({
            submissionId: entry.submissionId, categoryId, categoryName: entry.categoryName,
            title: entry.title, authorName: entry.authorName, photoUrl: entry.photoUrl,
            isProofVerified: entry.proofVerifiedAt !== null, isResultsLocked: true,
            rank, finalScore: score, award: award?.code ?? null, awardRank: award?.rankOrder ?? null,
            awardTitle: award?.name ?? null, prizeValueVnd: award?.prizeValueVnd ?? null,
          });
        }
        start = end;
      }
    }
    if (usedTieBreaks.size !== tieBreaks.length) throw AppError.badRequest("Tie breaks must match actual ties");

    const [publication] = await tx.insert(contestPublications).values({
      contestId: id, roundId: round.id, contestName: contest.name, publishedAt: now,
      publishedBy: ownerId, entries: results, tieBreaks,
    }).returning();
    await tx.update(contests).set({ status: "RESULTS_PUBLISHED", updatedAt: now }).where(eq(contests.id, id));
    await tx.insert(contestNotifications).values([...new Set(entries.map(({ participantId }) => participantId))]
      .map((recipientId) => ({ recipientId, contestId: id, kind: "RESULTS_PUBLISHED", data: { contestId: id } })));
    return publicationDto(publication);
  });
}
