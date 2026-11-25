import { AppError } from "../utils/errors";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
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


function assignedSubmissions(judgeId: string, submissionId?: string) {
  return db
    .select({
      assignmentId: contestJudges.id,
      contestId: contests.id,
      contestName: contests.name,
      categoryId: categories.id,
      categoryName: categories.name,
      submissionId: submissions.id,
      title: submissions.title,
      description: submissions.description,
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
        sql`lower(${contests.status}) = 'judging'`,
        eq(submissions.status, "APPROVED"),
        submissionId ? eq(submissions.id, submissionId) : undefined,
      ),
    )
    .orderBy(desc(submissions.createdAt));
}

export async function getAssignedSubmissions(judgeId: string) {
  const rows = await assignedSubmissions(judgeId);
  return rows.map(({ imageOriginalPath, ...submission }) => ({
    ...submission,
    imageUrl: `/api/v1/judge/submissions/${submission.submissionId}/image`,
  }));
}

export async function getAssignedImageKey(judgeId: string, submissionId: string) {
  const [submission] = await assignedSubmissions(judgeId, submissionId).limit(1);
  if (!submission) throw AppError.notFound("Assigned submission not found");
  return submission.imageOriginalPath;
}

type JudgeTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function requireOpenJudging(tx: JudgeTransaction, contestId: string) {
  const [contest] = await tx
    .select({ status: contests.status })
    .from(contests)
    .where(and(eq(contests.id, contestId), eq(contests.isDeleted, false)))
    .for("update");
  if (contest?.status.toLowerCase() !== "judging") {
    throw AppError.conflict("The judging round is not open");
  }
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
      Number(item.score.toFixed(2)) !== item.score
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

    await requireOpenJudging(tx, submission.contestId);

    // Check the judge's active assignment.
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
      .where(eq(scoringCriteria.categoryId, submission.categoryId));

    if (criteria.length !== scores.length) {
      throw AppError.badRequest(
        "Score every criterion in the category exactly once",
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

    await tx.insert(evaluationScores).values(
      scores.map((item) => ({
        evaluationId: evaluation.id,
        criterionId: item.criterionId,
        score: item.score.toFixed(2),
      })),
    ).onConflictDoUpdate({
      target: [evaluationScores.evaluationId, evaluationScores.criterionId],
      set: { score: sql`excluded.score` },
    });

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
    const activeAssignment = and(
      eq(contestJudges.id, assignmentId),
      eq(contestJudges.judgeId, judgeId),
      eq(contestJudges.isActive, true),
    );
    const [current] = await tx
      .select({ contestId: contestJudges.contestId, lockedAt: contestJudges.lockedAt })
      .from(contestJudges)
      .where(activeAssignment);
    if (!current) throw AppError.forbidden("You are not authorized to lock this evaluation sheet");
    if (current.lockedAt) {
      return { assignmentId, lockedAt: current.lockedAt, alreadyLocked: true };
    }
    await requireOpenJudging(tx, current.contestId);

    const [assignment] = await tx
      .select({
        id: contestJudges.id,
        categoryId: contestJudges.categoryId,
        lockedAt: contestJudges.lockedAt,
      })
      .from(contestJudges)
      .where(activeAssignment)
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

    const [criterion] = await tx
      .select({ id: scoringCriteria.id })
      .from(scoringCriteria)
      .where(eq(scoringCriteria.categoryId, assignment.categoryId))
      .limit(1);
    if (!criterion) throw AppError.conflict("The category has no scoring criteria");

    const [missingScore] = await tx
      .select({ submissionId: submissions.id })
      .from(submissions)
      .innerJoin(scoringCriteria, eq(scoringCriteria.categoryId, submissions.categoryId))
      .leftJoin(evaluations, and(
        eq(evaluations.submissionId, submissions.id),
        eq(evaluations.judgeId, judgeId),
      ))
      .leftJoin(evaluationScores, and(
        eq(evaluationScores.evaluationId, evaluations.id),
        eq(evaluationScores.criterionId, scoringCriteria.id),
      ))
      .where(and(
        eq(submissions.contestId, current.contestId),
        eq(submissions.categoryId, assignment.categoryId),
        eq(submissions.status, "APPROVED"),
        isNull(evaluationScores.id),
      ))
      .limit(1);
    if (missingScore) throw AppError.conflict("Score all assigned submissions before locking the sheet");

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