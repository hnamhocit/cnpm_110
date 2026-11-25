import path from "node:path";
import sharp from "sharp";
import { getR2SignedReadUrl } from "../r2";
import { AppError } from "../utils/errors";
import type { Context } from "hono";
import type { AuthEnv } from "../middlewares/auth";
import {
    getAssignedSubmissions,
    getAssignedImageKey,
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

export async function handleGetAssignedImage(c: Context<AuthEnv>) {
    const submissionId = c.req.param("submissionId");
    if (!submissionId || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(submissionId)) {
        throw AppError.badRequest("Invalid submission ID");
    }

    const key = await getAssignedImageKey(c.get("user").id, submissionId);
    const uploadDir = path.resolve("uploads");
    const filePath = path.resolve(uploadDir, key);
    if (!filePath.startsWith(uploadDir + path.sep)) {
        throw AppError.notFound("Assigned image not found");
    }

    let source: ArrayBuffer;
    const localFile = Bun.file(filePath);
    if (await localFile.exists()) {
        source = await localFile.arrayBuffer();
    } else {
        const url = await getR2SignedReadUrl(key);
        if (!url.startsWith("https://")) throw AppError.notFound("Assigned image not found");

        const image = await fetch(url, { redirect: "error" });
        if (image.status === 404) throw AppError.notFound("Assigned image not found");
        if (!image.ok) throw new Error("Assigned image storage request failed");
        source = await image.arrayBuffer();
    }

    // Sharp strips source metadata by default. PNG keeps the decoded pixels lossless.
    const image = await sharp(Buffer.from(source)).autoOrient().png().toBuffer();
    return new Response(new Uint8Array(image), {
        headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" },
    });
}
