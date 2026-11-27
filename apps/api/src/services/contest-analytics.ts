import { env } from "../config/env";
import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db";
import {
  categories,
  contests,
  filmMetadata,
  submissionAiAnalyses,
  submissions,
} from "../db/schema";
import { AppError } from "../utils/errors";

type Counts = {
  submissions: number;
  aiWarnings: number;
  byStatus: Record<string, number>;
};

function emptyCounts(): Counts {
  return { submissions: 0, aiWarnings: 0, byStatus: {} };
}

export async function getContestAnalytics(contestId: string, organizerId: string) {
  const [contest] = await db.select({ id: contests.id, name: contests.name })
    .from(contests).where(and(
      eq(contests.id, contestId),
      eq(contests.createdBy, organizerId),
      eq(contests.isDeleted, false),
    ));
  if (!contest) throw AppError.notFound("Contest not found");

  const rows = await db.select({
    categoryId: categories.id,
    categoryName: categories.name,
    status: submissions.status,
    total: count(submissions.id),
    flagged: count(sql`CASE WHEN ${submissionAiAnalyses.isAiFlagged} OR
      ${submissionAiAnalyses.duplicateSuspectId} IS NOT NULL OR
      ${submissions.status} IN ('FLAGGED', 'SUSPICIOUS') THEN 1 END`),
  }).from(categories)
    .leftJoin(submissions, eq(submissions.categoryId, categories.id))
    .leftJoin(submissionAiAnalyses, eq(submissionAiAnalyses.submissionId, submissions.id))
    .where(eq(categories.contestId, contestId))
    .groupBy(categories.id, categories.name, submissions.status)
    .orderBy(categories.name, categories.id, submissions.status);

  const totals = emptyCounts();
  const byCategory = new Map<string, Counts & { name: string }>();

  for (const row of rows) {
    const category = byCategory.get(row.categoryId) ?? { name: row.categoryName, ...emptyCounts() };
    byCategory.set(row.categoryId, category);
    if (row.status === null) continue;

    category.submissions += row.total;
    category.aiWarnings += row.flagged;
    category.byStatus[row.status] = row.total;
    totals.submissions += row.total;
    totals.aiWarnings += row.flagged;
    totals.byStatus[row.status] = (totals.byStatus[row.status] ?? 0) + row.total;
  }

  return {
    contest,
    totals,
    categories: [...byCategory.values()],
    filmStocks: await getFilmStockStats(contestId),
    isoDistribution: await getIsoDistribution(contestId),
    labs: await getLabStats(contestId),
    cameras: await getCameraStats(contestId),
  };
}

async function getFilmStockStats(contestId: string) {
  return db
    .select({
      name: filmMetadata.filmStock,
      count: count(submissions.id),
    })
    .from(submissions)
    .innerJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(eq(submissions.contestId, contestId))
    .groupBy(filmMetadata.filmStock)
    .orderBy(desc(count(submissions.id)), filmMetadata.filmStock);
}

async function getIsoDistribution(contestId: string) {
  return db
    .select({
      iso: filmMetadata.isoRated,
      count: count(submissions.id),
    })
    .from(submissions)
    .innerJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(eq(submissions.contestId, contestId))
    .groupBy(filmMetadata.isoRated)
    .orderBy(filmMetadata.isoRated);
}

async function getLabStats(contestId: string) {
  return db
    .select({
      name: filmMetadata.devLabName,
      count: count(submissions.id),
    })
    .from(submissions)
    .innerJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.contestId, contestId),
        isNotNull(filmMetadata.devLabName),
        sql`length(trim(${filmMetadata.devLabName})) > 0`,
      ),
    )
    .groupBy(filmMetadata.devLabName)
    .orderBy(desc(count(submissions.id)), filmMetadata.devLabName);
}

async function getCameraStats(contestId: string) {
  return db
    .select({
      name: filmMetadata.cameraBody,
      count: count(submissions.id),
    })
    .from(submissions)
    .innerJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(eq(submissions.contestId, contestId))
    .groupBy(filmMetadata.cameraBody)
    .orderBy(desc(count(submissions.id)), filmMetadata.cameraBody);
}

export async function generateContestAnalytics(
  statistics: Awaited<ReturnType<typeof getContestAnalytics>>,
) {
  const url = env.aiAnalyticsUrl;
  if (!url) return null;

  const { totals, categories } = statistics;
  const payload = {
    totals,
    categories: categories.map(({ submissions, aiWarnings, byStatus }) => ({
      submissions, aiWarnings, byStatus,
    })),
  };

  try {
    const key = env.aiAnalyticsApiKey;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
    if (!response.ok) return null;
    const data = await response.json() as { report?: unknown };
    return typeof data?.report === "string" ? data.report.trim().slice(0, 10_000) || null : null;
  } catch {
    return null;
  }
}
