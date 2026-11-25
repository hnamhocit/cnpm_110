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

const TEST_DB_NAME = "fpc31_migration_test";
const TEST_SECRET = "fpc74-scoreboard-integration-secret-at-least-32-characters";

const { default: contestsRoute } = await import(
    "../src/routes/contests.route"
);

const app = createTestApp();
app.route("/api/v1/contests", contestsRoute);

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
        `INSERT INTO users
            (id, full_name, email, password_hash, is_active)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [id, name, `${id}@fpc74-test.example`, "test-password-hash"],
    );
}

async function createTestData() {
    const adminId = crypto.randomUUID();
    const organizerId = crypto.randomUUID();
    const otherOrganizerId = crypto.randomUUID();
    const participantId = crypto.randomUUID();
    const judge1Id = crypto.randomUUID();
    const judge2Id = crypto.randomUUID();

    const contestId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();

    const submissionId = crypto.randomUUID();
    const pendingSubmissionId = crypto.randomUUID();

    const criterion1Id = crypto.randomUUID();
    const criterion2Id = crypto.randomUUID();

    await insertUser(adminId, "FPC74 Test Admin");
    await insertUser(organizerId, "FPC74 Test Organizer");
    await insertUser(otherOrganizerId, "FPC74 Other Organizer");
    await insertUser(participantId, "FPC74 Test Participant");
    await insertUser(judge1Id, "FPC74 Test Judge 1");
    await insertUser(judge2Id, "FPC74 Test Judge 2");

    await pool.query(
        `INSERT INTO contests (id, name, status, created_by)
         VALUES ($1, $2, $3, $4)`,
        [contestId, "FPC74 Scoreboard Test", "ongoing", organizerId],
    );

    await pool.query(
        `INSERT INTO categories (id, contest_id, name)
         VALUES ($1, $2, $3)`,
        [categoryId, contestId, "FPC74 Test Category"],
    );

    await pool.query(
        `INSERT INTO scoring_criteria
            (id, category_id, name, max_score, weight, sort_order)
         VALUES
            ($1, $2, $3, 10, 0.5, 1),
            ($4, $2, $5, 10, 0.5, 2)`,
        [
            criterion1Id,
            categoryId,
            "Composition",
            criterion2Id,
            "Creativity",
        ],
    );

    await pool.query(
        `INSERT INTO contest_judges
            (id, contest_id, category_id, judge_id, assigned_by, is_active)
         VALUES
            ($1, $2, $3, $4, $5, TRUE),
            ($6, $2, $3, $7, $5, TRUE)`,
        [
            crypto.randomUUID(),
            contestId,
            categoryId,
            judge1Id,
            organizerId,
            crypto.randomUUID(),
            judge2Id,
        ],
    );

    await pool.query(
        `INSERT INTO submissions
            (id, contest_id, category_id, participant_id,
             title, image_original_path, status)
         VALUES
            ($1, $2, $3, $4, $5, $6, 'APPROVED'),
            ($7, $2, $3, $4, $8, $9, 'PENDING_AI')`,
        [
            submissionId,
            contestId,
            categoryId,
            participantId,
            "FPC74 Approved Film",
            "fpc74/approved.jpg",
            pendingSubmissionId,
            "FPC74 Pending Film",
            "fpc74/pending.jpg",
        ],
    );

    const evaluation1Id = crypto.randomUUID();
    const evaluation2Id = crypto.randomUUID();

    await pool.query(
        `INSERT INTO evaluations (id, submission_id, judge_id)
         VALUES
            ($1, $2, $3),
            ($4, $2, $5)`,
        [
            evaluation1Id,
            submissionId,
            judge1Id,
            evaluation2Id,
            judge2Id,
        ],
    );

    await pool.query(
        `INSERT INTO evaluation_scores
            (id, evaluation_id, criterion_id, score)
         VALUES
            ($1, $2, $3, 8),
            ($4, $2, $5, 10),
            ($6, $7, $3, 6),
            ($8, $7, $5, 8)`,
        [
            crypto.randomUUID(),
            evaluation1Id,
            criterion1Id,
            crypto.randomUUID(),
            criterion2Id,
            crypto.randomUUID(),
            evaluation2Id,
            crypto.randomUUID(),
        ],
    );

    return {
        adminId,
        organizerId,
        otherOrganizerId,
        participantId,
        judge1Id,
        judge2Id,
        contestId,
        submissionId,
        pendingSubmissionId,
    };
}

async function cleanupTestData(data: {
    adminId: string;
    organizerId: string;
    otherOrganizerId: string;
    participantId: string;
    contestId: string;
    submissionId: string;
    pendingSubmissionId: string;
    judge1Id: string;
    judge2Id: string;
}) {
    await pool.query(
        "DELETE FROM submissions WHERE contest_id = $1",
        [data.contestId],
    );

    await pool.query(
        "DELETE FROM contests WHERE id = $1",
        [data.contestId],
    );

    await pool.query(
        "DELETE FROM users WHERE id = ANY($1::uuid[])",
        [[
            data.adminId,
            data.organizerId,
            data.otherOrganizerId,
            data.participantId,
            data.judge1Id,
            data.judge2Id,
        ]],
    );
}

describe("FPC-74: GET /api/v1/contests/:id/scoreboard", () => {
    let originalJwtSecret: string | undefined;
    let testData: Awaited<ReturnType<typeof createTestData>>;

    beforeAll(async () => {
        const result = await pool.query(
            "SELECT current_database() AS db",
        );

        if (result.rows[0]?.db !== TEST_DB_NAME) {
            throw new Error(
                `Integration tests must use ${TEST_DB_NAME}. Current: ${result.rows[0]?.db}`,
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

    test("Rejects requests without a token", async () => {
        const response = await app.request(
            `/api/v1/contests/${testData.contestId}/scoreboard`,
        );

        expect(response.status).toBe(401);
    });

    test("Participant cannot access scoreboard", async () => {
        const token = await createToken(
            testData.participantId,
            "Participant",
        );

        const response = await app.request(
            `/api/v1/contests/${testData.contestId}/scoreboard`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        expect(response.status).toBe(403);
    });

    test("Organizer cannot view another organizer's contest", async () => {
        const token = await createToken(
            testData.otherOrganizerId,
            "Organizer",
        );

        const response = await app.request(
            `/api/v1/contests/${testData.contestId}/scoreboard`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        expect(response.status).toBe(403);
    });

    test("Admin can retrieve the scoreboard", async () => {
        const token = await createToken(testData.adminId, "Admin");

        const response = await app.request(
            `/api/v1/contests/${testData.contestId}/scoreboard`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body.code).toBe(200);
        expect(body.data.entries).toHaveLength(1);

        const entry = body.data.entries[0];

        expect(entry.submissionId).toBe(testData.submissionId);
        expect(entry.title).toBe("FPC74 Approved Film");
        expect(entry.judgeCount).toBe(2);
        expect(entry.scoreScale).toBe(10);
        expect(entry.negativeProofVerified).toBe(false);
        expect(entry.scores).toHaveLength(2);

        const scores = entry.scores
            .map((item: { totalScore: number }) => item.totalScore)
            .sort((a: number, b: number) => a - b);

        expect(scores).toEqual([7, 9]);
    });

    test("Organizer can view their own contest scoreboard", async () => {
        const token = await createToken(
            testData.organizerId,
            "Organizer",
        );

        const response = await app.request(
            `/api/v1/contests/${testData.contestId}/scoreboard`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        expect(response.status).toBe(200);
    });

    test("Returns 404 when contest does not exist", async () => {
        const token = await createToken(testData.adminId, "Admin");

        const response = await app.request(
            `/api/v1/contests/${crypto.randomUUID()}/scoreboard`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        expect(response.status).toBe(404);
    });
});
