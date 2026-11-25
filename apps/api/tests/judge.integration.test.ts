
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
} from "bun:test";
import { sign } from "hono/jwt";
import { pool } from "../src/db";
import { createTestApp } from "./helpers/test-app";

const TEST_DB_NAME = process.env.TEST_DB_NAME || "fpc_test";
const TEST_SECRET = "fpc70-judge-integration-secret-at-least-32-characters";

const { default: judgeRoute } = await import("../src/routes/judge.route");

const app = createTestApp();
app.route("/api/v1/judge", judgeRoute);

async function createToken(userId: string, role: string) {
    return sign(
        {
            id: userId,
            role,
            exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET,
        "HS256",
    );
}

async function insertUser(id: string, name: string) {
    await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, is_active)
     VALUES ($1, $2, $3, $4, TRUE)`,
        [id, name, `${id}@fpc70-test.example`, "test-password-hash"],
    );
}

async function createTestData() {
    const judgeId = crypto.randomUUID();
    const otherJudgeId = crypto.randomUUID();
    const participantId = crypto.randomUUID();
    const contestId = crypto.randomUUID();
    const assignmentId = crypto.randomUUID();
    const assignedCategoryId = crypto.randomUUID();
    const otherCategoryId = crypto.randomUUID();

    await insertUser(judgeId, "FPC72 Test Judge");
    await insertUser(otherJudgeId, "FPC72 Other Judge");
    await insertUser(participantId, "FPC72 Test Participant");

    await pool.query(
        `INSERT INTO contests (id, name, status, created_by)
     VALUES ($1, $2, $3, $4)`,
        [contestId, "FPC70 Test Contest", "ongoing", judgeId],
    );

    await pool.query(
        `INSERT INTO categories (id, contest_id, name)
     VALUES ($1, $2, $3), ($4, $2, $5)`,
        [
            assignedCategoryId,
            contestId,
            "Assigned Category",
            otherCategoryId,
            "Other Category",
        ],
    );

    await pool.query(
        `INSERT INTO contest_judges
      (id, contest_id, category_id, judge_id, assigned_by, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [
            assignmentId,
            contestId,
            assignedCategoryId,
            judgeId,
            judgeId,
        ],
    );

    const assignedSubmissionId = crypto.randomUUID();
    const otherSubmissionId = crypto.randomUUID();
    const assignedCriterionId = crypto.randomUUID();
    const otherCriterionId = crypto.randomUUID();

    await pool.query(
        `INSERT INTO scoring_criteria
    (id, category_id, name, max_score, weight)
   VALUES
    ($1, $2, $3, $4, $5),
    ($6, $7, $8, $9, $10)`,
        [
            assignedCriterionId,
            assignedCategoryId,
            "Composition",
            10,
            1,
            otherCriterionId,
            otherCategoryId,
            "Other Category Criterion",
            10,
            1,
        ],
    );
    await pool.query(
        `INSERT INTO submissions
      (id, contest_id, category_id, participant_id, title,
       image_original_path, status)
     VALUES
      ($1, $2, $3, $4, $5, $6, 'APPROVED'),
      ($7, $2, $8, $4, $9, $10, 'APPROVED')`,
        [
            assignedSubmissionId,
            contestId,
            assignedCategoryId,
            participantId,
            "FPC70 Assigned Submission",
            "test/assigned.jpg",
            otherSubmissionId,
            otherCategoryId,
            "FPC70 Other Category Submission",
            "test/other.jpg",
        ],
    );

    return {
        judgeId,
        otherJudgeId,
        assignmentId,
        participantId,
        contestId,
        assignedSubmissionId,
        otherSubmissionId,
        assignedCriterionId,
        otherCriterionId,
    };
}

async function cleanupTestData(data: {
    judgeId: string;
    otherJudgeId: string;
    participantId: string;
    contestId: string;
}) {
    await pool.query(
        "DELETE FROM submissions WHERE contest_id = $1",
        [data.contestId],
    );

    await pool.query(
        "DELETE FROM contest_judges WHERE contest_id = $1",
        [data.contestId],
    );

    await pool.query(
        "DELETE FROM categories WHERE contest_id = $1",
        [data.contestId],
    );

    await pool.query(
        "DELETE FROM contests WHERE id = $1",
        [data.contestId],
    );

    await pool.query(
        "DELETE FROM users WHERE id = ANY($1::uuid[])",
        [[data.judgeId, data.otherJudgeId, data.participantId]],
    );
}

describe("FPC-70/FPC-71: Judge APIs", () => {
    let originalJwtSecret: string | undefined;
    let testData: Awaited<ReturnType<typeof createTestData>>;

    beforeAll(async () => {
        const result = await pool.query(
            "SELECT current_database() AS db",
        );

        if (result.rows[0]?.db !== TEST_DB_NAME) {
            throw new Error(
                `Integration tests must use ${TEST_DB_NAME}`,
            );
        }

        originalJwtSecret = process.env.JWT_SECRET;
        process.env.JWT_SECRET = TEST_SECRET;
        Bun.env.JWT_SECRET = TEST_SECRET;

        testData = await createTestData();
    });

    afterAll(async () => {
        if (testData) {
            await cleanupTestData(testData);
        }

        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
            delete Bun.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalJwtSecret;
            Bun.env.JWT_SECRET = originalJwtSecret;
        }
    });

    test("Uses the correct test database", async () => {
        const result = await pool.query(
            "SELECT current_database() AS db",
        );

        expect(result.rows[0]?.db).toBe(TEST_DB_NAME);
    });

    test("Judge sees only submissions in assigned categories", async () => {
        const token = await createToken(testData.judgeId, "Judge");

        const response = await app.request(
            "/api/v1/judge/assignments",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        expect(response.status).toBe(200);

        const body = await response.json();
        const serialized = JSON.stringify(body);

        expect(serialized).toContain(
            "FPC70 Assigned Submission",
        );

        expect(serialized).not.toContain(
            "FPC70 Other Category Submission",
        );

        expect(serialized).not.toContain(
            testData.participantId,
        );
    });

    test("Participant cannot access judge assignments", async () => {
        const token = await createToken(
            testData.participantId,
            "Participant",
        );

        const response = await app.request(
            "/api/v1/judge/assignments",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        expect(response.status).toBe(403);
    });

    test("Unauthenticated user cannot access judge assignments", async () => {
        const response = await app.request(
            "/api/v1/judge/assignments",
        );

        expect(response.status).toBe(401);
    });
    test("Judge can submit and update evaluation scores", async () => {
        const token = await createToken(testData.judgeId, "Judge");

        const url =
            `/api/v1/judge/submissions/${testData.assignedSubmissionId}/evaluation`;

        // Submit the first evaluation
        const firstResponse = await app.request(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                comment: "Good composition",
                scores: [
                    {
                        criterionId: testData.assignedCriterionId,
                        score: 8.5,
                    },
                ],
            }),
        });

        expect(firstResponse.status).toBe(200);

        // Submit again to update the existing evaluation
        const secondResponse = await app.request(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                comment: "Updated evaluation",
                scores: [
                    {
                        criterionId: testData.assignedCriterionId,
                        score: 7,
                    },
                ],
            }),
        });

        expect(secondResponse.status).toBe(200);

        // Verify that only one evaluation exists and its score was updated
        const result = await pool.query(
            `SELECT e.id, e.comment, es.score
             FROM evaluations e
             JOIN evaluation_scores es
               ON es.evaluation_id = e.id
             WHERE e.submission_id = $1
               AND e.judge_id = $2`,
            [
                testData.assignedSubmissionId,
                testData.judgeId,
            ],
        );

        expect(result.rowCount).toBe(1);
        expect(result.rows[0].comment).toBe("Updated evaluation");
        expect(Number(result.rows[0].score)).toBe(7);
    });

    test("Judge cannot evaluate a submission outside assigned category", async () => {
        const token = await createToken(testData.judgeId, "Judge");

        const response = await app.request(
            `/api/v1/judge/submissions/${testData.otherSubmissionId}/evaluation`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scores: [
                        {
                            criterionId: testData.otherCriterionId,
                            score: 8,
                        },
                    ],
                }),
            },
        );

        expect(response.status).toBe(403);
    });

    test("Judge cannot use a criterion from another category", async () => {
        const token = await createToken(testData.judgeId, "Judge");

        const response = await app.request(
            `/api/v1/judge/submissions/${testData.assignedSubmissionId}/evaluation`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scores: [
                        {
                            criterionId: testData.otherCriterionId,
                            score: 8,
                        },
                    ],
                }),
            },
        );

        expect(response.status).toBe(400);
    });

    test("Judge cannot submit a score above criterion maximum", async () => {
        const token = await createToken(testData.judgeId, "Judge");

        const response = await app.request(
            `/api/v1/judge/submissions/${testData.assignedSubmissionId}/evaluation`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scores: [
                        {
                            criterionId: testData.assignedCriterionId,
                            score: 11,
                        },
                    ],
                }),
            },
        );

        expect(response.status).toBe(400);
    });

    test("Participant cannot submit evaluation scores", async () => {
        const token = await createToken(
            testData.participantId,
            "Participant",
        );

        const response = await app.request(
            `/api/v1/judge/submissions/${testData.assignedSubmissionId}/evaluation`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scores: [
                        {
                            criterionId: testData.assignedCriterionId,
                            score: 8,
                        },
                    ],
                }),
            },
        );

        expect(response.status).toBe(403);
    });

    test("Unauthenticated user cannot submit evaluation scores", async () => {
        const response = await app.request(
            `/api/v1/judge/submissions/${testData.assignedSubmissionId}/evaluation`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scores: [
                        {
                            criterionId: testData.assignedCriterionId,
                            score: 8,
                        },
                    ],
                }),
            },
        );

        expect(response.status).toBe(401);
    });
    test("Rejects null score items", async () => {
        const token = await createToken(testData.judgeId, "Judge");

        const response = await app.request(
            `/api/v1/judge/submissions/${testData.assignedSubmissionId}/evaluation`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scores: [null],
                }),
            },
        );

        expect(response.status).toBe(400);
    });

    test("Rejects score items without criterion ID", async () => {
        const token = await createToken(testData.judgeId, "Judge");

        const response = await app.request(
            `/api/v1/judge/submissions/${testData.assignedSubmissionId}/evaluation`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scores: [
                        {
                            score: 8,
                        },
                    ],
                }),
            },
        );

        expect(response.status).toBe(400);
    });
    test("Another judge cannot lock someone else's assignment", async () => {
        const token = await createToken(
            testData.otherJudgeId,
            "Judge",
        );

        const response = await app.request(
            `/api/v1/judge/assignments/${testData.assignmentId}/lock`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        expect(response.status).toBe(403);
    });

    test("Judge can lock assignment and cannot update scores afterward", async () => {
        const token = await createToken(
            testData.judgeId,
            "Judge",
        );

        const lockUrl =
            `/api/v1/judge/assignments/${testData.assignmentId}/lock`;

        const firstResponse = await app.request(lockUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        expect(firstResponse.status).toBe(200);

        const firstLock = await pool.query(
            `SELECT locked_at
             FROM contest_judges
             WHERE id = $1`,
            [testData.assignmentId],
        );

        expect(firstLock.rows[0].locked_at).not.toBeNull();

        const secondResponse = await app.request(lockUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        expect(secondResponse.status).toBe(200);

        const secondLock = await pool.query(
            `SELECT locked_at
             FROM contest_judges
             WHERE id = $1`,
            [testData.assignmentId],
        );

        expect(secondLock.rows[0].locked_at.toISOString()).toBe(
            firstLock.rows[0].locked_at.toISOString(),
        );

        const updateResponse = await app.request(
            `/api/v1/judge/submissions/${testData.assignedSubmissionId}/evaluation`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    comment: "Trying to update after locking",
                    scores: [
                        {
                            criterionId: testData.assignedCriterionId,
                            score: 9,
                        },
                    ],
                }),
            },
        );

        expect(updateResponse.status).toBe(409);
    });
});
