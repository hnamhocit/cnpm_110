import {
    afterAll,
    beforeAll,
    describe,
    expect,
    mock,
    test,
} from "bun:test";
import { sign } from "hono/jwt";
import sharp from "sharp";
import { pool } from "../src/db";
import { createTestApp } from "./helpers/test-app";

const TEST_DB_NAME = process.env.TEST_DB_NAME || "fpc_test";
const TEST_SECRET = "bug28-integration-test-secret-at-least-32-characters";

// Mock R2 trước khi import route submissions
mock.module("../src/r2", () => ({
    uploadToR2: async (_file: File, key: string) => key,
    deleteFromR2: async (_key: string) => { },
    getR2SignedReadUrl: async (key: string) => `/uploads/${key}`,
}));

const { default: submissionRoute } = await import("../src/routes/submissions.route");

const app = createTestApp();
app.route("/api/v1/submissions", submissionRoute);

async function createParticipantToken(participantId: string) {
    return sign(
        {
            id: participantId,
            role: "Participant",
            exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET,
        "HS256",
    );
}

async function makeTestImage() {
    const buffer = await sharp({
        create: {
            width: 2000,
            height: 2000,
            channels: 3,
            background: { r: 100, g: 150, b: 200 },
        },
    })
        .jpeg()
        .toBuffer();

    return new File([new Uint8Array(buffer)], "bug28-test.jpg", {
        type: "image/jpeg",
    });
}

async function createTestData() {
    const participantId = crypto.randomUUID();
    const organizerId = crypto.randomUUID();
    const contestId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();

    await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, is_active)
     VALUES ($1, $2, $3, $4, TRUE)`,
        [
            participantId,
            "Bug 28 Test Participant",
            `bug28-${participantId}@example.com`,
            "test-password-hash",
        ],
    );

    await pool.query("INSERT INTO roles(name) VALUES ('Participant') ON CONFLICT (name) DO NOTHING");
    await pool.query("INSERT INTO user_roles(user_id, role_id) SELECT $1, id FROM roles WHERE name = 'Participant'", [participantId]);
    await pool.query(
        "INSERT INTO users (id, full_name, email, password_hash) VALUES ($1, 'Test Organizer', $2, 'test')",
        [organizerId, `bug28-${organizerId}@example.com`],
    );

    await pool.query(
        `INSERT INTO contests
     (id, name, start_at, end_at, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            contestId,
            "Bug 28 Test Contest",
            new Date(Date.now() - 24 * 60 * 60 * 1000),
            new Date(Date.now() + 24 * 60 * 60 * 1000),
            "ongoing",
            organizerId,
        ],
    );

    await pool.query(
        `INSERT INTO categories (id, contest_id, name)
     VALUES ($1, $2, $3)`,
        [categoryId, contestId, "Bug 28 Test Category"],
    );

    return { participantId, organizerId, contestId, categoryId };
}

async function cleanupTestData(contestId: string, participantId: string, organizerId: string) {
    await pool.query(
        `DELETE FROM film_metadata
     WHERE submission_id IN (
       SELECT id FROM submissions WHERE contest_id = $1
     )`,
        [contestId],
    );
    await pool.query("DELETE FROM submissions WHERE contest_id = $1", [contestId]);
    await pool.query("DELETE FROM categories WHERE contest_id = $1", [contestId]);
    await pool.query("DELETE FROM contests WHERE id = $1", [contestId]);
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[participantId, organizerId]]);
}

async function submitTestImage(
    participantId: string,
    contestId: string,
    categoryId: string,
    rollId = "ROLL-001",
    frameNumber = "01",
) {
    const form = new FormData();

    form.set("contestId", contestId);
    form.set("categoryId", categoryId);
    form.set("title", "Bug 28 Test Submission");
    form.set("filmBrand", "Kodak");
    form.set("filmStock", "Portra 400");
    form.set("filmFormat", "135");
    form.set("isoRated", "400");
    form.set("isoShot", "400");
    form.set("cameraBody", "Canon AE-1");
    form.set("devLabName", "Test lab");
    form.set("rollId", rollId);
    form.set("frameNumber", frameNumber);
    form.set("image", await makeTestImage());

    const token = await createParticipantToken(participantId);

    return app.request("/api/v1/submissions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: form,
    });
}

describe("Bug 28: Submission integration tests", () => {
    let originalJwtSecret: string | undefined;

    beforeAll(async () => {
        const result = await pool.query("SELECT current_database() AS db");

        if (result.rows[0]?.db !== TEST_DB_NAME) {
            throw new Error(`Integration tests must use ${TEST_DB_NAME}`);
        }

        originalJwtSecret = process.env.JWT_SECRET;
        process.env.JWT_SECRET = TEST_SECRET;
        Bun.env.JWT_SECRET = TEST_SECRET;
    });

    afterAll(() => {
        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
            delete Bun.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalJwtSecret;
            Bun.env.JWT_SECRET = originalJwtSecret;
        }
    });

    test("Connects to the correct test database", async () => {
        const result = await pool.query("SELECT current_database() AS db");
        expect(result.rows[0]?.db).toBe(TEST_DB_NAME);
    });

    test("Creates a valid 2000x2000 JPEG test image", async () => {
        const image = await makeTestImage();
        expect(image.type).toBe("image/jpeg");
        expect(image.size).toBeGreaterThan(0);
        expect(image.size).toBeLessThanOrEqual(25 * 1024 * 1024);
    });

    test("BR-08: Rejects submissions after deadline", async () => {
        const { participantId, organizerId, contestId, categoryId } = await createTestData();

        try {
            await pool.query("UPDATE contests SET end_at = $1 WHERE id = $2", [
                new Date(Date.now() - 60_000),
                contestId,
            ]);

            const response = await submitTestImage(
                participantId,
                contestId,
                categoryId,
            );

            expect(response.status).toBe(400);

            const body = await response.json();
            expect(body.message).toBe("Submission deadline has passed");
        } finally {
            await cleanupTestData(contestId, participantId, organizerId);
        }
    });

    test("BR-21: A contest owner cannot submit as Participant", async () => {
        const { participantId, organizerId, contestId, categoryId } = await createTestData();
        try {
            await pool.query("UPDATE contests SET created_by = $1 WHERE id = $2", [participantId, contestId]);
            const response = await submitTestImage(participantId, contestId, categoryId);
            expect(response.status).toBe(403);
        } finally {
            await cleanupTestData(contestId, participantId, organizerId);
        }
    });

    test("BR-05/23: Accepts frame 40 and rejects duplicate entries across categories", async () => {
        const { participantId, organizerId, contestId, categoryId } = await createTestData();

        try {
            const secondCategoryId = crypto.randomUUID();
            await pool.query("INSERT INTO categories (id, contest_id, name) VALUES ($1, $2, $3)",
                [secondCategoryId, contestId, "Second category"]);
            const firstResponse = await submitTestImage(
                participantId,
                contestId,
                categoryId,
                "ROLL-001",
                "40",
            );
            expect(firstResponse.status).toBe(201);

            const secondResponse = await submitTestImage(
                participantId,
                contestId,
                secondCategoryId,
                "ROLL-001",
                "040",
            );
            expect(secondResponse.status).toBe(409);

            const body = await secondResponse.json();
            expect(body.error ?? body.message).toBeTruthy();
        } finally {
            await cleanupTestData(contestId, participantId, organizerId);
        }
    });
});
