
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  categories,
  contestJudges,
  contests,
  submissions,
} from "../db/schema";


export async function getAssignedSubmissions(judgeId: string) {
  const rows = await db
    .select({
      assignmentId: contestJudges.id,
      contestId: contests.id,
      contestName: contests.name,
      categoryId: categories.id,
      categoryName: categories.name,
      submissionId: submissions.id,
      title: submissions.title,
      description: submissions.description,
      imagePreviewPath: submissions.imagePreviewPath,
      imageOriginalPath: submissions.imageOriginalPath,
      width: submissions.width,
      height: submissions.height,
      submittedAt: submissions.createdAt,
      status: submissions.status,
    })
    .from(contestJudges)
    .innerJoin(
      contests,
      eq(contestJudges.contestId, contests.id),
    )
    .innerJoin(
      categories,
      eq(contestJudges.categoryId, categories.id),
    )
    .innerJoin(
      submissions,
      and(
        eq(submissions.contestId, contestJudges.contestId),
        eq(submissions.categoryId, contestJudges.categoryId),
      ),
    )
    .where(
      and(
        eq(contestJudges.judgeId, judgeId),
        eq(contestJudges.isActive, true),
        eq(contests.isDeleted, false),
        eq(submissions.status, "APPROVED"),
      ),
    )
    .orderBy(desc(submissions.createdAt));

  return rows;
}
