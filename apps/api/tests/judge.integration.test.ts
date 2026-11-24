
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
  const participantId = crypto.randomUUID();
  const contestId = crypto.randomUUID();
  const assignedCategoryId = crypto.randomUUID();
  const otherCategoryId = crypto.randomUUID();

  await insertUser(judgeId, "FPC70 Test Judge");
  await insertUser(participantId, "FPC70 Test Participant");

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
      crypto.randomUUID(),
      contestId,
      assignedCategoryId,
      judgeId,
      judgeId,
    ],
  );

  const assignedSubmissionId = crypto.randomUUID();
  const otherSubmissionId = crypto.randomUUID();

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
    participantId,
    contestId,
    assignedSubmissionId,
    otherSubmissionId,
  };
}

async function cleanupTestData(data: {
  judgeId: string;
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
    [[data.judgeId, data.participantId]],
  );
}

describe("FPC-70: Judge assigned submissions", () => {
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
});
