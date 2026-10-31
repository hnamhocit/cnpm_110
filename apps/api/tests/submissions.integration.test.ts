import { Hono } from "hono";
import { sign } from "hono/jwt";
import sharp from "sharp";
import { beforeAll, afterAll, describe, expect, test, mock } from "bun:test";
import { Pool } from "pg";

const TEST_DB_NAME = "fpc_bug28_test";

// Set test database before importing application modules.
const originalDatabaseUrl = process.env.DATABASE_URL;
const configuredUrl = process.env.DATABASE_URL;

if (!configuredUrl) {
    throw new Error("DATABASE_URL is required for integration tests");
}

const testUrl = new URL(configuredUrl);

if (testUrl.pathname.slice(1) !== TEST_DB_NAME) {
    throw new Error(
        "Set DATABASE_URL to fpc_bug28_test before running integration tests",
    );
}

// Prevent real Cloudflare R2 operations.
mock.module("../src/r2", () => ({
    uploadToR2: async (_file: File, key: string) => key,
    deleteFromR2: async (_key: string) => { },
}));
const { default: submissionRoute } = await import(
    "../src/routes/submissions"
);

const app = new Hono();
app.route("/api/v1/submissions", submissionRoute);

const TEST_SECRET = "bug28-integration-test-secret-at-least-32-characters";

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
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
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

    await pool.query(
        `INSERT INTO contests
         (id, name, start_at, end_at, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            contestId,
            "Bug 28 Test Contest",
            new Date(Date.now() - 24 * 60 * 60 * 1000),
            new Date(Date.now() + 24 * 60 * 60 * 1000),
            "active",
            participantId,
        ],
    );

    await pool.query(
        `INSERT INTO categories (id, contest_id, name)
         VALUES ($1, $2, $3)`,
        [categoryId, contestId, "Bug 28 Test Category"],
    );

    return { participantId, contestId, categoryId };
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
    form.set("filmFormat", "35mm");
    form.set("isoRated", "400");
    form.set("isoShot", "400");
    form.set("cameraBody", "Canon AE-1");
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
const originalJwtSecret = process.env.JWT_SECRET;
describe("Bug 28: Submission integration tests", () => {
    beforeAll(async () => {
        const result = await pool.query(
            "SELECT current_database() AS db",
        );

        if (result.rows[0]?.db !== TEST_DB_NAME) {
            throw new Error("Integration tests must use fpc_bug28_test");
        }
        process.env.JWT_SECRET = TEST_SECRET;
        Bun.env.JWT_SECRET = TEST_SECRET;
    });

    test("Connects to the correct test database", async () => {
        const result = await pool.query(
            "SELECT current_database() AS db",
        );

        expect(result.rows[0]?.db).toBe(TEST_DB_NAME);
    });
    test("Creates a valid 2000x2000 JPEG test image", async () => {
        const image = await makeTestImage();

        expect(image.type).toBe("image/jpeg");
        expect(image.size).toBeGreaterThan(0);
        expect(image.size).toBeLessThanOrEqual(25 * 1024 * 1024);
    });
    test("BR-08: Rejects submissions after deadline", async () => {
        const { participantId, contestId, categoryId } =
            await createTestData();

        try {
            await pool.query(
                "UPDATE contests SET end_at = $1 WHERE id = $2",
                [new Date(Date.now() - 60_000), contestId],
            );

            const response = await submitTestImage(
                participantId,
                contestId,
                categoryId,
            );

            const responseText = await response.clone().text();

            console.log("BR-08 HTTP status:", response.status);
            console.log("BR-08 response:", responseText);

            expect(response.status).toBe(400);

            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.message).toBe("Submission deadline has passed");
        }
        finally {
            await pool.query(
                "DELETE FROM categories WHERE contest_id = $1",
                [contestId],
            );

            await pool.query(
                "DELETE FROM contests WHERE id = $1",
                [contestId],
            );

            await pool.query(
                "DELETE FROM users WHERE id = $1",
                [participantId],
            );
        }
    });
    test("BR-05: Rejects duplicate film roll and frame", async () => {
    const { participantId, contestId, categoryId } =
        await createTestData();

    try {
        const firstResponse = await submitTestImage(
            participantId,
            contestId,
            categoryId,
            "ROLL-001",
            "01",
        );

        console.log("BR-05 first status:", firstResponse.status);
        console.log("BR-05 first response:", await firstResponse.clone().text());

        expect(firstResponse.status).toBe(201);

        const secondResponse = await submitTestImage(
            participantId,
            contestId,
            categoryId,
            "ROLL-001",
            "01",
        );

        console.log("BR-05 second status:", secondResponse.status);
        console.log("BR-05 second response:", await secondResponse.clone().text());

        expect(secondResponse.status).toBe(409);

        const body = await secondResponse.json();
        expect(body.success).toBe(false);
    } finally {
        await pool.query(
            `DELETE FROM film_metadata
             WHERE submission_id IN (
               SELECT id FROM submissions WHERE contest_id = $1
             )`,
            [contestId],
        );

        await pool.query(
            "DELETE FROM submissions WHERE contest_id = $1",
            [contestId],
        );

        await pool.query(
            "DELETE FROM categories WHERE contest_id = $1",
            [contestId],
        );

        await pool.query(
            "DELETE FROM contests WHERE id = $1",
            [contestId],
        );

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [participantId],
        );
    }
});
    afterAll(async () => {
        await pool.end();
        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
            delete Bun.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalJwtSecret;
            Bun.env.JWT_SECRET = originalJwtSecret;
        }
        if (originalDatabaseUrl === undefined) {
            delete process.env.DATABASE_URL;
        } else {
            process.env.DATABASE_URL = originalDatabaseUrl;
        }
    });
});
