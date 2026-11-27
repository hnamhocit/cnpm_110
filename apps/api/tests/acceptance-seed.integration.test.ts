import { afterAll, beforeAll, expect, test } from "bun:test";
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { pool } from "../src/db";
import {
  acceptanceIds as ids,
  assertAcceptanceEnvironment,
  seedAcceptance,
} from "../src/db/seed/acceptance";
import auth from "../src/routes/auth.route";
import contests from "../src/routes/contests.route";
import submissions from "../src/routes/submissions.route";
import exhibitions from "../src/routes/exhibitions.route";
import { startNotificationDelivery } from "../src/services/notification-delivery";
import { createTestApp } from "./helpers/test-app";

const app = createTestApp();
app.route("/api/v1/auth", auth);
app.route("/api/v1/contests", contests);
app.route("/api/v1/submissions", submissions);
app.route("/api/v1/exhibitions", exhibitions);
const tokens: Record<string, string> = {};
async function request(
  method: string,
  path: string,
  actor?: string,
  body?: unknown,
) {
  const response = await app.request(`/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(actor ? { Authorization: `Bearer ${tokens[actor]}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
beforeAll(async () => {
  assertAcceptanceEnvironment();
  if (
    !new URL(process.env.DATABASE_URL!).pathname.startsWith(
      "/cinegen_acceptance_verify",
    )
  ) {
    throw new Error(
      "Use a dedicated cinegen_acceptance_verify_* database for the seed smoke test",
    );
  }
  await seedAcceptance();
});
afterAll(() => pool.end());

test("N134-01 blocks production, remote databases and configured cloud storage", () => {
  const original = {
    url: Bun.env.DATABASE_URL,
    node: Bun.env.NODE_ENV,
    r2: Bun.env.R2_BUCKET_NAME,
  };
  try {
    Bun.env.NODE_ENV = "production";
    expect(assertAcceptanceEnvironment).toThrow();
    Bun.env.NODE_ENV = "test";
    Bun.env.DATABASE_URL =
      "postgresql://test:test@remote.invalid/cinegen_acceptance_test";
    expect(assertAcceptanceEnvironment).toThrow();
    Bun.env.DATABASE_URL = original.url;
    Bun.env.R2_BUCKET_NAME = "production-bucket";
    expect(assertAcceptanceEnvironment).toThrow();
  } finally {
    Bun.env.DATABASE_URL = original.url;
    Bun.env.NODE_ENV = original.node;
    Bun.env.R2_BUCKET_NAME = original.r2;
  }
});
test("N134-02 all seven actors login through the real API with hashed passwords", async () => {
  for (const [actor, role] of [
    ["A", "Admin"],
    ["O1", "Organizer"],
    ["O2", "Organizer"],
    ["P1", "Participant"],
    ["P2", "Participant"],
    ["J1", "Judge"],
    ["J2", "Judge"],
  ]) {
    const result = await request("POST", "/auth/login", undefined, {
      email: `acceptance.${actor.toLowerCase()}@example.com`,
      password: "password123",
    });
    expect(result.status).toBe(200);
    expect(result.body.data.user.role).toBe(role);
    tokens[actor] = result.body.data.accessToken;
    const account = (
      await pool.query("SELECT password_hash FROM users WHERE id=$1", [
        ids[actor as keyof typeof ids],
      ])
    ).rows[0];
    expect(account.password_hash).not.toBe("password123");
    expect(
      await Bun.password.verify("password123", account.password_hash),
    ).toBe(true);
  }
});
test("N134-03/04 real contest/category APIs match ownership, unique codes and 100 percent weights", async () => {
  for (const [contest, owner, categories] of [
    ["C1", "O1", ["K1", "K2"]],
    ["C2", "O2", ["K3"]],
    ["C3", "O1", ["K4"]],
  ] as const) {
    const detail = await request("GET", `/contests/${ids[contest]}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.createdBy).toBe(ids[owner]);
    const dates = [
      "registrationStartAt",
      "submissionDeadlineAt",
      "judgingStartAt",
      "judgingDeadlineAt",
      "publishedAt",
    ].map((key) => Date.parse(detail.body.data[key]));
    expect(
      dates.every(
        (date, index) =>
          Number.isFinite(date) && (index === 0 || date > dates[index - 1]),
      ),
    ).toBe(true);
    const result = await request("GET", `/contests/${ids[contest]}/categories`);
    expect(
      result.body.data.map((row: { id: string }) => row.id).sort(),
    ).toEqual(categories.map((alias) => ids[alias]).sort());
  }
  const weights = await pool.query(
    "SELECT category_id,sum(weight)::text AS total FROM scoring_criteria GROUP BY category_id",
  );
  expect(weights.rows.every((row) => Number(row.total) === 1)).toBe(true);
  expect(
    (
      await pool.query(
        "SELECT code FROM contests GROUP BY code HAVING count(*)>1",
      )
    ).rows,
  ).toHaveLength(0);
  expect(
    (await request("GET", `/contests/${ids.C1}/rounds`, "O2")).status,
  ).toBe(403);
  expect(
    (await request("GET", `/contests/${ids.C1}/rounds`, "O1")).body.data[0]
      .lockedAt,
  ).not.toBeNull();
});
test("N134-05 available roll metadata is owned correctly with distinct roll/frame tuples", async () => {
  const data = await pool.query(
    "SELECT s.participant_id,m.roll_id,m.frame_number,r.user_id FROM submissions s JOIN film_metadata m ON m.submission_id=s.id LEFT JOIN film_rolls r ON r.id::text=m.roll_id",
  );
  expect(data.rows).toHaveLength(4);
  expect(data.rows.every((row) => row.participant_id === row.user_id)).toBe(
    true,
  );
  expect(
    new Set(data.rows.map((row) => `${row.roll_id}:${row.frame_number}`)).size,
  ).toBe(4);
});
test.skip("N134-05 registration and Frame API verification awaits UC-17/34/35/36 schema and routes", () => {});
test("N134-06 scan/proof files exist, meet dimensions and public previews expose no master", async () => {
  for (const work of [ids.S1, ids.S2, ids.S3, ids.S4]) {
    const row = (
      await pool.query("SELECT * FROM submissions WHERE id=$1", [work])
    ).rows[0];
    const original = Bun.file(`uploads/${row.image_original_path}`);
    expect(await original.exists()).toBe(true);
    const metadata = await sharp(
      Buffer.from(await original.arrayBuffer()),
    ).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(Math.min(metadata.width!, metadata.height!)).toBeGreaterThanOrEqual(
      2000,
    );
    expect(await Bun.file(`uploads/${row.negative_proof_path}`).exists()).toBe(
      true,
    );
  }
  const gallery = await request("GET", `/exhibitions?contestId=${ids.C1}`);
  expect(gallery.body.data.items).toHaveLength(2);
  for (const item of gallery.body.data.items) {
    const preview = await app.request(item.imageUrl);
    expect(preview.status).toBe(200);
    expect(preview.headers.get("Content-Type")).toContain("image/webp");
    expect(JSON.stringify(item)).not.toContain("submissions/");
  }
  expect(
    (await request("GET", `/submissions/${ids.S1}/proof/image`, "P2")).status,
  ).toBe(404);
  const proof = await app.request(`/api/v1/submissions/${ids.S1}/proof/image`, {
    headers: { Authorization: `Bearer ${tokens.P1}` },
  });
  expect(proof.status).toBe(200);
});
test("N134-07/08 published scores and feedback match real final sheets; C3 has no premature results", async () => {
  const result = await request("GET", `/contests/${ids.C1}/results`);
  expect(result.status).toBe(200);
  expect(
    result.body.data.entries
      .map((entry: { finalScore: number }) => entry.finalScore)
      .sort(),
  ).toEqual([7.5, 8.5]);
  const feedback = await request(
    "GET",
    `/submissions/${ids.S1}/feedback`,
    "P1",
  );
  expect(feedback.body.data.result.finalScore).toBe(8.5);
  expect(feedback.body.data.feedback).toHaveLength(2);
  expect(
    (await request("GET", `/submissions/${ids.S1}/feedback`, "P2")).status,
  ).toBe(403);
  expect((await request("GET", `/contests/${ids.C3}/results`)).status).toBe(
    400,
  );
  const scores = await pool.query(
    "SELECT e.submission_id,avg(x.total)::numeric AS score FROM evaluations e JOIN LATERAL (SELECT sum(es.score*k.weight) AS total FROM evaluation_scores es JOIN scoring_criteria k ON k.id=es.criterion_id WHERE es.evaluation_id=e.id) x ON true WHERE e.round_id=$1 GROUP BY e.submission_id",
    [ids.R1],
  );
  expect(scores.rows.map((row) => Number(row.score)).sort()).toEqual([
    7.5, 8.5,
  ]);
});
test("N134-10 second seed preserves fixture rows and current test state", async () => {
  const count = () =>
    pool.query(
      "SELECT (SELECT count(*) FROM contests) c,(SELECT count(*) FROM evaluations) e,(SELECT count(*) FROM scoring_criteria) k,(SELECT count(*) FROM submissions) s",
    );
  const before = await count();
  const folder = `uploads/acceptance/${new URL(process.env.DATABASE_URL!).pathname.slice(1)}`;
  const filesBefore = (await readdir(folder, { recursive: true })).sort();
  await seedAcceptance();
  expect((await count()).rows).toEqual(before.rows);
  expect((await readdir(folder, { recursive: true })).sort()).toEqual(
    filesBefore,
  );
});
test("N134-09/11 invalid owner, missing proof and unlocked sheets are isolated; published C1 replays through API while C3 remains unpublished", async () => {
  expect(
    (
      await request("POST", `/contests/${ids.C3}/publish-results`, "O2", {
        confirm: true,
      })
    ).status,
  ).toBe(403);
  try {
    await pool.query(
      "UPDATE contest_judges SET locked_at=NULL WHERE round_id=$1",
      [ids.R2],
    );
    expect(
      (
        await request("POST", `/contests/${ids.C3}/publish-results`, "O1", {
          confirm: true,
        })
      ).status,
    ).toBe(409);
  } finally {
    await pool.query(
      "UPDATE contest_judges SET locked_at=(SELECT locked_at FROM judging_rounds WHERE id=$1) WHERE round_id=$1",
      [ids.R2],
    );
  }
  const proof = (
    await pool.query("SELECT proof_verified_at FROM submissions WHERE id=$1", [
      ids.S3,
    ])
  ).rows[0].proof_verified_at;
  try {
    await pool.query(
      "UPDATE submissions SET proof_verified_at=NULL WHERE id=$1",
      [ids.S3],
    );
    expect(
      (
        await request("POST", `/contests/${ids.C3}/publish-results`, "O1", {
          confirm: true,
        })
      ).status,
    ).toBe(409);
  } finally {
    await pool.query(
      "UPDATE submissions SET proof_verified_at=$2 WHERE id=$1",
      [ids.S3, proof],
    );
  }
  const published = await request(
    "POST",
    `/contests/${ids.C1}/publish-results`,
    "O1",
    { confirm: true },
  );
  expect(published.status).toBe(200);
  expect(
    published.body.data.entries.map(
      (entry: { finalScore: number }) => entry.finalScore,
    ),
  ).toEqual([8.5, 7.5]);
});

test("normal proof request is delivered by the automatic worker without a command", async () => {
  const sub = (
    await pool.query(
      "INSERT INTO submissions(contest_id,category_id,participant_id,title,image_original_path,status) VALUES ($1,$2,$3,'Automatic delivery regression','test.jpg','VERIFIED') RETURNING id",
      [ids.C2, ids.K3, ids.P1],
    )
  ).rows[0].id;
  let delivered = false;
  const stop = startNotificationDelivery(async (_to, _subject, text) => {
    if (text.includes(sub)) delivered = true;
  }, 10);
  try {
    const result = await request(
      "POST",
      `/submissions/${sub}/request-proof`,
      "O2",
      {
        proofType: "negative",
        proofDeadlineAt: new Date(Date.now() + 86400000).toISOString(),
        reason: "Automatic worker test",
      },
    );
    expect(result.status).toBe(200);
    const until = Date.now() + 5000;
    while (!delivered && Date.now() < until)
      await new Promise((resolve) => setTimeout(resolve, 20));
    expect(delivered).toBe(true);
  } finally {
    await stop();
    await pool.query(
      "DELETE FROM contest_notifications WHERE data->>'submissionId'=$1",
      [sub],
    );
    await pool.query(
      "DELETE FROM submission_moderation_logs WHERE submission_id=$1",
      [sub],
    );
    await pool.query("DELETE FROM submissions WHERE id=$1", [sub]);
  }
});
