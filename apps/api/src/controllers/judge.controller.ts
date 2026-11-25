import { AppError } from "../utils/errors";
import type { Context } from "hono";
import type { AuthEnv } from "../middlewares/auth";
import {
    getAssignedSubmissions,
    submitEvaluation,
    lockJudgeAssignment,
} from "../services/judge.service";

export async function handleGetAssignedSubmissions(
    c: Context<AuthEnv>,
) {
    const judge = c.get("user");

    const submissions = await getAssignedSubmissions(judge.id);

    return c.ok(
        {
            items: submissions,
            total: submissions.length,
        },
        "Assigned submissions retrieved successfully",
    );
}
export async function handleSubmitEvaluation(
    c: Context<AuthEnv>,
) {
    const judge = c.get("user");
    const submissionId = c.req.param("submissionId");

    // Validate submission ID.
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!submissionId || !uuidRegex.test(submissionId)) {
        throw AppError.badRequest("Invalid submission ID");
    }

    // Parse JSON body.
    let body: unknown;

    try {
        body = await c.req.json();
    } catch {
        throw AppError.badRequest("Invalid JSON body");
    }

    if (
        typeof body !== "object" ||
        body === null ||
        !("scores" in body) ||
        !Array.isArray(body.scores)
    ) {
        throw AppError.badRequest("Invalid evaluation request body");
    }

    const requestBody = body as {
        comment?: unknown;
        scores: unknown[];
    };

    // Validate comment.
    const comment = requestBody.comment;

    if (
        comment !== undefined &&
        comment !== null &&
        typeof comment !== "string"
    ) {
        throw AppError.badRequest("Comment must be a string");
    }

    // Validate each score item.
    if (requestBody.scores.length === 0) {
        throw AppError.badRequest("At least one criterion score is required");
    }

    const scores: {
        criterionId: string;
        score: number;
    }[] = [];

    for (const item of requestBody.scores) {
        if (
            typeof item !== "object" ||
            item === null ||
            !("criterionId" in item) ||
            !("score" in item)
        ) {
            throw AppError.badRequest("Invalid criterion score");
        }

        const scoreItem = item as Record<string, unknown>;

        if (
            typeof scoreItem.criterionId !== "string" ||
            !uuidRegex.test(scoreItem.criterionId) ||
            typeof scoreItem.score !== "number" ||
            !Number.isFinite(scoreItem.score)
        ) {
            throw AppError.badRequest("Invalid criterion score");
        }

        scores.push({
            criterionId: scoreItem.criterionId,
            score: scoreItem.score,
        });
    }

    const result = await submitEvaluation({
        submissionId,
        judgeId: judge.id,
        comment: comment as string | null | undefined,
        scores,
    });

    return c.ok(
        result,
        "Evaluation submitted successfully",
    );
}
export async function handleLockJudgeAssignment(
    c: Context<AuthEnv>,
) {
    const judge = c.get("user");
    const assignmentId = c.req.param("assignmentId");

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!assignmentId || !uuidRegex.test(assignmentId)) {
        throw AppError.badRequest("Invalid assignment ID");
    }

    const result = await lockJudgeAssignment(
        assignmentId,
        judge.id,
    );

    return c.ok(
        result,
        result.alreadyLocked
            ? "Evaluation sheet was already locked"
            : "Evaluation sheet locked successfully",
    );
}