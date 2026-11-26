import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  categories,
  contestPublications,
  contests,
  evaluations,
  evaluationScores,
  scoringCriteria,
  submissions,
  users,
  type OfficialResultEntry,
} from "../db/schema";
import { AppError } from "../utils/errors";

async function requirePublishedPublication(contestId: string) {
  const [contest] = await db
    .select({
      id: contests.id,
      name: contests.name,
      status: contests.status,
      isDeleted: contests.isDeleted,
    })
    .from(contests)
    .where(and(eq(contests.id, contestId), eq(contests.isDeleted, false)))
    .limit(1);

  if (!contest) {
    throw AppError.notFound("Contest not found");
  }

  const [publication] = await db
    .select()
    .from(contestPublications)
    .where(eq(contestPublications.contestId, contestId))
    .limit(1);

  const status = contest.status.toLowerCase();
  if (!publication || !["results_published", "published", "archived"].includes(status)) {
    throw AppError.conflict("Contest results have not been published yet");
  }

  return { contest, publication };
}

function roundTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function loadSubmissionJudgeFeedback(submissionId: string, roundId: string) {
  const rows = await db
    .select({
      evaluationId: evaluations.id,
      judgeId: evaluations.judgeId,
      judgeName: users.fullName,
      comment: evaluations.comment,
      evaluatedAt: evaluations.updatedAt,
      criterionId: scoringCriteria.id,
      criterionName: scoringCriteria.name,
      criterionSortOrder: scoringCriteria.sortOrder,
      weight: scoringCriteria.weight,
      maxScore: scoringCriteria.maxScore,
      score: evaluationScores.score,
    })
    .from(evaluations)
    .innerJoin(users, eq(users.id, evaluations.judgeId))
    .leftJoin(evaluationScores, eq(evaluationScores.evaluationId, evaluations.id))
    .leftJoin(scoringCriteria, eq(scoringCriteria.id, evaluationScores.criterionId))
    .where(and(eq(evaluations.submissionId, submissionId), eq(evaluations.roundId, roundId)))
    .orderBy(asc(users.fullName), asc(evaluations.judgeId), asc(scoringCriteria.sortOrder), asc(scoringCriteria.id));

  const byEval = new Map<string, {
    evaluationId: string;
    judgeId: string;
    judgeName: string;
    comment: string | null;
    evaluatedAt: Date;
    weightedSum: number;
    criterionScores: {
      criterionId: string;
      criterionName: string;
      score: number;
      maxScore: number;
      weight: number;
    }[];
  }>();

  for (const row of rows) {
    let item = byEval.get(row.evaluationId);
    if (!item) {
      item = {
        evaluationId: row.evaluationId,
        judgeId: row.judgeId,
        judgeName: row.judgeName,
        comment: row.comment ?? null,
        evaluatedAt: row.evaluatedAt,
        weightedSum: 0,
        criterionScores: [],
      };
      byEval.set(row.evaluationId, item);
    }

    if (row.criterionId && row.criterionName !== null && row.score !== null && row.weight !== null && row.maxScore !== null) {
      const score = Number(row.score);
      const weight = Number(row.weight);
      const maxScore = Number(row.maxScore);
      item.weightedSum += score * weight;
      item.criterionScores.push({
        criterionId: row.criterionId,
        criterionName: row.criterionName,
        score,
        maxScore,
        weight,
      });
    }
  }

  return [...byEval.values()].map(({ weightedSum, ...rest }) => ({
    ...rest,
    totalScore: roundTwoDecimals(weightedSum),
  }));
}

function mapOfficialResult(entry: OfficialResultEntry | undefined) {
  if (!entry) return null;
  return {
    rank: entry.rank,
    finalScore: entry.finalScore,
    finalScoreFormatted: entry.finalScore.toFixed(2),
    award: entry.award,
    awardRank: entry.awardRank,
    awardTitle: entry.awardTitle,
    prizeValueVnd: entry.prizeValueVnd,
    isProofVerified: entry.isProofVerified,
    isResultsLocked: entry.isResultsLocked,
  };
}

export async function getMySubmissionResultAndFeedback(submissionId: string, participantId: string) {
  const [row] = await db
    .select({
      submission: submissions,
      categoryName: categories.name,
      contestDeleted: contests.isDeleted,
    })
    .from(submissions)
    .innerJoin(categories, eq(categories.id, submissions.categoryId))
    .innerJoin(contests, eq(contests.id, submissions.contestId))
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!row || row.contestDeleted) {
    throw AppError.notFound("Submission not found");
  }

  if (row.submission.participantId !== participantId) {
    throw AppError.forbidden("MSG005: You do not have permission to view this submission feedback");
  }

  const { contest, publication } = await requirePublishedPublication(row.submission.contestId);
  const official = publication.entries.find((entry) => entry.submissionId === submissionId);
  const feedback = official ? await loadSubmissionJudgeFeedback(submissionId, publication.roundId) : [];

  return {
    submissionId: row.submission.id,
    contestId: contest.id,
    contestName: contest.name,
    categoryId: row.submission.categoryId,
    categoryName: row.categoryName,
    title: row.submission.title,
    roundId: publication.roundId,
    publishedAt: publication.publishedAt,
    status: "RESULTS_PUBLISHED",
    resultsLocked: true,
    result: mapOfficialResult(official),
    feedback,
  };
}

export async function getMyContestResults(contestId: string, participantId: string) {
  const { contest, publication } = await requirePublishedPublication(contestId);

  const mySubmissions = await db
    .select({
      id: submissions.id,
      title: submissions.title,
      categoryId: submissions.categoryId,
      categoryName: categories.name,
      status: submissions.status,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .innerJoin(categories, eq(categories.id, submissions.categoryId))
    .where(and(eq(submissions.contestId, contestId), eq(submissions.participantId, participantId)))
    .orderBy(asc(submissions.createdAt), asc(submissions.id));

  const items = await Promise.all(
    mySubmissions.map(async (sub) => {
      const official = publication.entries.find((entry) => entry.submissionId === sub.id);
      const feedback = official ? await loadSubmissionJudgeFeedback(sub.id, publication.roundId) : [];
      return {
        submissionId: sub.id,
        categoryId: sub.categoryId,
        categoryName: sub.categoryName,
        title: sub.title,
        submissionStatus: sub.status,
        result: mapOfficialResult(official),
        feedback,
      };
    }),
  );

  return {
    contestId: contest.id,
    contestName: contest.name,
    roundId: publication.roundId,
    publishedAt: publication.publishedAt,
    status: "RESULTS_PUBLISHED",
    resultsLocked: true,
    submissions: items,
  };
}
