import { AppError } from "../utils/errors";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  categories,
  contestJudges,
  contests,
  submissions,
  scoringCriteria,
  evaluations,
  evaluationScores,
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

export interface SubmitEvaluationInput {
  submissionId: string;
  judgeId: string;
  comment?: string | null;
  scores: {
    criterionId: string;
    score: number;
  }[];
}

export async function submitEvaluation(input: SubmitEvaluationInput) {
  const { submissionId, judgeId, comment, scores } = input;

  if (!Array.isArray(scores) || scores.length === 0) {
    throw AppError.badRequest("At least one criterion score is required");
  }

  if (
    comment !== undefined &&
    comment !== null &&
    typeof comment !== "string"
  ) {
    throw AppError.badRequest("Comment must be a string");
  }

  if (comment && comment.length > 5000) {
    throw AppError.badRequest("Comment must not exceed 5000 characters");
  }

  const criterionIds = scores.map((item) => item.criterionId);

  if (new Set(criterionIds).size !== criterionIds.length) {
    throw AppError.badRequest("Duplicate scoring criteria are not allowed");
  }

  for (const item of scores) {
    if (
      typeof item.score !== "number" ||
      !Number.isFinite(item.score) ||
      item.score < 0 ||
      Math.round(item.score * 100) !== item.score * 100
    ) {
      throw AppError.badRequest(
        "Scores must be non-negative numbers with at most 2 decimal places",
      );
    }
  }

  return db.transaction(async (tx) => {
    // 1. Check whether the submission exists and is approved.
    const [submission] = await tx
      .select({
        id: submissions.id,
        contestId: submissions.contestId,
        categoryId: submissions.categoryId,
        status: submissions.status,
      })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!submission) {
      throw AppError.notFound("Submission not found");
    }

    if (submission.status !== "APPROVED") {
      throw AppError.badRequest(
        "Only approved submissions can be evaluated",
      );
    }

    // 2. Check the judge's active assignment.
    const [assignment] = await tx
      .select({
        id: contestJudges.id,
        lockedAt: contestJudges.lockedAt,
      })
      .from(contestJudges)
      .where(
        and(
          eq(contestJudges.judgeId, judgeId),
          eq(contestJudges.contestId, submission.contestId),
          eq(contestJudges.categoryId, submission.categoryId),
          eq(contestJudges.isActive, true),
        ),
      )
      .limit(1)
      .for("update");

    if (!assignment) {
      throw AppError.forbidden(
        "You are not assigned to evaluate this submission",
      );
    }

    if (assignment.lockedAt) {
      throw AppError.conflict(
        "Your evaluation sheet has been locked and cannot be modified",
      );
    }
    // 3. Check that all criteria belong to the submission category.
    const criteria = await tx
      .select({
        id: scoringCriteria.id,
        maxScore: scoringCriteria.maxScore,
      })
      .from(scoringCriteria)
      .where(
        and(
          eq(scoringCriteria.categoryId, submission.categoryId),
          inArray(scoringCriteria.id, criterionIds),
        ),
      );

    if (criteria.length !== scores.length) {
      throw AppError.badRequest(
        "One or more scoring criteria are invalid for this category",
      );
    }

    // 4. Validate each score against its criterion's maximum score.
    const criteriaMap = new Map(
      criteria.map((criterion) => [
        criterion.id,
        Number(criterion.maxScore),
      ]),
    );

    for (const item of scores) {
      const maxScore = criteriaMap.get(item.criterionId);

      if (
        maxScore === undefined ||
        item.score > maxScore
      ) {
        throw AppError.badRequest(
          `Score for criterion ${item.criterionId} exceeds its maximum score`,
        );
      }
    }

    // 5. Create or update the judge's evaluation.
    const [evaluation] = await tx
      .insert(evaluations)
      .values({
        submissionId,
        judgeId,
        comment: comment ?? null,
      })
      .onConflictDoUpdate({
        target: [
          evaluations.submissionId,
          evaluations.judgeId,
        ],
        set: {
          comment: comment ?? null,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: evaluations.id,
      });

    // 6. Replace the previous criterion scores.
    await tx
      .delete(evaluationScores)
      .where(eq(evaluationScores.evaluationId, evaluation.id));

    await tx.insert(evaluationScores).values(
      scores.map((item) => ({
        evaluationId: evaluation.id,
        criterionId: item.criterionId,
        score: item.score.toFixed(2),
      })),
    );

    return {
      evaluationId: evaluation.id,
      submissionId,
      comment: comment ?? null,
      scores,
    };
  });
}
export async function lockJudgeAssignment(
  assignmentId: string,
  judgeId: string,
) {
  return db.transaction(async (tx) => {
    const [assignment] = await tx
      .select({
        id: contestJudges.id,
        lockedAt: contestJudges.lockedAt,
      })
      .from(contestJudges)
      .where(
        and(
          eq(contestJudges.id, assignmentId),
          eq(contestJudges.judgeId, judgeId),
          eq(contestJudges.isActive, true),
        ),
      )
      .limit(1)
      .for("update");

    if (!assignment) {
      throw AppError.forbidden(
        "You are not authorized to lock this evaluation sheet",
      );
    }

    if (assignment.lockedAt) {
      return {
        assignmentId: assignment.id,
        lockedAt: assignment.lockedAt,
        alreadyLocked: true,
      };
    }

    const lockedAt = new Date();

    await tx
      .update(contestJudges)
      .set({ lockedAt })
      .where(eq(contestJudges.id, assignmentId));

    return {
      assignmentId,
      lockedAt,
      alreadyLocked: false,
    };
  });
}