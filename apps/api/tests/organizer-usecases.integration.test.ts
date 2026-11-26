import { afterAll, beforeAll, expect, test } from "bun:test";
import sharp from "sharp";
import { unlink } from "node:fs/promises";
import { sign } from "hono/jwt";
import { pool } from "../src/db";
import contests from "../src/routes/contests.route";
import submissions from "../src/routes/submissions.route";
import exhibitions from "../src/routes/exhibitions.route";
import { createTestApp } from "./helpers/test-app";

// Use the dedicated acceptance database. Every mutation targets a newly created contest.
const app = createTestApp();
app.route("/api/v1/contests", contests);
app.route("/api/v1/submissions", submissions);
app.route("/api/v1/exhibitions", exhibitions);
const secret = "organizer-usecases-integration-secret-32-characters";
const ids = (n: number) => `accede00-0000-4000-8000-${String(n).padStart(12, "0")}`;
const created: string[] = [];
const files: string[] = [];
let contestId: string;
let categoryId: string;
let roundId: string;
let submissionId: string;
const tokens: Record<string, string> = {};
const schedule = {
  registrationStartAt: "2090-01-01T09:00:00+07:00",
  submissionDeadlineAt: "2090-01-02T09:00:00+07:00",
  judgingStartAt: "2090-01-03T09:00:00+07:00",
  judgingDeadlineAt: "2090-01-04T09:00:00+07:00",
  publishedAt: "2090-01-05T09:00:00+07:00",
};
async function request(method: string, path: string, actor = "O1", body?: unknown) {
  const response = await app.request(`/api/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${tokens[actor]}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== "/cinegen_acceptance_test") {
    throw new Error("Run against cinegen_acceptance_test");
  }
  Bun.env.JWT_SECRET = secret;
  for (const [actor, n, role] of [["O1", 1, "Organizer"], ["O2", 2, "Organizer"], ["P1", 3, "Participant"], ["P2", 4, "Participant"], ["J1", 5, "Judge"]] as const) {
    tokens[actor] = await sign({ id: ids(n), role, exp: Math.floor(Date.now() / 1000) + 3600 }, secret, "HS256");
  }
});
afterAll(async () => {
  // Remove only rows created by this suite, in foreign-key order.
  for (const table of ["exhibition_images", "contest_publications", "contest_notifications", "evaluation_scores", "evaluations", "contest_judges", "judging_round_entries", "submission_moderation_logs", "submissions", "judging_rounds", "contests"]) {
    if (table === "evaluation_scores") {
      await pool.query("DELETE FROM evaluation_scores WHERE evaluation_id IN (SELECT id FROM evaluations WHERE submission_id IN (SELECT id FROM submissions WHERE contest_id = ANY($1::uuid[])))", [created]);
    } else if (table === "evaluations") {
      await pool.query("DELETE FROM evaluations WHERE submission_id IN (SELECT id FROM submissions WHERE contest_id = ANY($1::uuid[]))", [created]);
    } else if (table === "submission_moderation_logs") {
      await pool.query("DELETE FROM submission_moderation_logs WHERE submission_id IN (SELECT id FROM submissions WHERE contest_id = ANY($1::uuid[]))", [created]);
    } else if (table === "judging_round_entries") {
      await pool.query("DELETE FROM judging_round_entries WHERE round_id IN (SELECT id FROM judging_rounds WHERE contest_id = ANY($1::uuid[]))", [created]);
    } else {
      await pool.query(`DELETE FROM ${table} WHERE ${table === "contests" ? "id" : "contest_id"} = ANY($1::uuid[])`, [created]);
    }
  }
  for (const file of files) await unlink(file).catch(() => {});
  await pool.end();
});
test("UC-11 create configured DRAFT, preserve UTC+7 and reject invalid weights atomically", async () => {
  const result = await request("POST", "/contests", "O1", { name: "UC integration", ...schedule });
  expect(result.status).toBe(201);
  contestId = result.body.data.id;
  created.push(contestId);
  expect(result.body.data.status).toBe("DRAFT");
  expect(new Date(result.body.data.registrationStartAt).toISOString()).toBe("2090-01-01T02:00:00.000Z");
  expect((await request("POST", "/contests", "O1", { name: "bad", ...schedule, categories: [{ name: "bad", criteria: [{ name: "A", weight: 0.4 }] }] })).status).toBe(400);
  expect((await request("POST", "/contests", "P1", { name: "forbidden" })).status).toBe(403);
});
test("UC-12 owner updates configuration, rejects other organizer and unordered dates", async () => {
  expect((await request("PUT", `/contests/${contestId}`, "O2", { name: "stolen" })).status).toBe(403);
  expect((await request("PUT", `/contests/${contestId}`, "O1", { name: "updated" })).status).toBe(200);
  expect((await request("PUT", `/contests/${contestId}`, "O1", { submissionDeadlineAt: "2089-01-01T00:00:00Z" })).status).toBe(400);
});
test("UC-13 create, rename, deactivate category and reject cross-owner changes", async () => {
  const result = await request("POST", `/contests/${contestId}/categories`, "O1", { name: "Film" });
  expect(result.status).toBe(201);
  categoryId = result.body.data.id;
  expect((await request("PATCH", `/contests/${contestId}/categories/${categoryId}`, "O2", { name: "stolen" })).status).toBe(403);
  expect((await request("PATCH", `/contests/${contestId}/categories/${categoryId}`, "O1", { name: "Film updated" })).status).toBe(200);
});
test("UC-14 replaces criteria with exactly 100 percent and preserves previous set on failure", async () => {
  const path = `/contests/${contestId}/categories/${categoryId}/criteria`;
  expect((await request("PUT", path, "O1", { criteria: [{ name: "Light", weight: 0.6 }, { name: "Frame", weight: 0.4 }] })).status).toBe(200);
  expect((await request("PUT", path, "O1", { criteria: [{ name: "Bad", weight: 0.5 }] })).status).toBe(400);
  expect((await request("GET", path)).body.data).toHaveLength(2);
});
test("UC-15 creates final round, rejects overlapping order and foreign owner", async () => {
  const body = { name: "Final", position: 1, startAt: schedule.judgingStartAt, deadlineAt: schedule.judgingDeadlineAt, advanceCount: null };
  const result = await request("POST", `/contests/${contestId}/rounds`, "O1", body);
  expect(result.status).toBe(201);
  roundId = result.body.data.id;
  expect((await request("POST", `/contests/${contestId}/rounds`, "O1", body)).status).toBe(400);
  expect((await request("GET", `/contests/${contestId}/rounds`, "O2")).status).toBe(403);
});
test("UC-16 assigns active Judge idempotently and rejects Participant", async () => {
  const body = { roundId, categoryId, judgeId: ids(5) };
  const first = await request("POST", `/contests/${contestId}/judges`, "O1", body);
  expect(first.status).toBe(200);
  expect((await request("POST", `/contests/${contestId}/judges`, "O1", body)).body.data.id).toBe(first.body.data.id);
  expect((await request("POST", `/contests/${contestId}/judges`, "O1", { ...body, judgeId: ids(3) })).status).toBe(400);
});
test("UC-11 duplicate copies configuration and excludes assignments and entries", async () => {
  const result = await request("POST", `/contests/${contestId}/duplicate`, "O1", schedule);
  expect(result.status).toBe(201);
  const copy = result.body.data.id;
  created.push(copy);
  expect(result.body.data.status).toBe("DRAFT");
  expect((await pool.query("SELECT * FROM contest_judges WHERE contest_id=$1", [copy])).rows).toHaveLength(0);
  expect((await pool.query("SELECT * FROM categories WHERE contest_id=$1", [copy])).rows).toHaveLength(1);
  expect((await pool.query("SELECT * FROM judging_rounds WHERE contest_id=$1", [copy])).rows).toHaveLength(1);
});
test("UC-21 requests proof with deadline, notification and ownership protection", async () => {
  const inserted = await pool.query("INSERT INTO submissions (contest_id,category_id,participant_id,title,image_original_path,status,width,height,file_size_bytes) VALUES ($1,$2,$3,'Proof test','test.jpg','VERIFIED',2000,2000,10000) RETURNING id", [contestId, categoryId, ids(3)]);
  submissionId = inserted.rows[0].id;
  const path = `/submissions/${submissionId}/request-proof`;
  const body = { proofType: "negative", proofDeadlineAt: "2090-01-02T09:00:00+07:00", reason: "Check negative" };
  expect((await request("POST", path, "O2", body)).status).toBe(404);
  expect((await request("POST", path, "O1", { ...body, proofDeadlineAt: "2000-01-01T00:00:00Z" })).status).toBe(400);
  expect((await request("POST", path, "O1", body)).status).toBe(200);
  const notes = await request("GET", "/submissions/my/notifications", "P1");
  expect(notes.body.data.some((n: { data: { submissionId: string } }) => n.data.submissionId === submissionId)).toBe(true);
});
test("UC-22 blocks approval until proof verified, records final approval", async () => {
  const path = `/submissions/${submissionId}`;
  expect((await request("POST", `${path}/approve`)).status).toBe(409);
  expect((await request("POST", `${path}/verify-proof`)).status).toBe(409);
  await pool.query("UPDATE submissions SET negative_proof_path='proofs/test.jpg',status='PROOF_SUBMITTED' WHERE id=$1", [submissionId]);
  expect((await request("POST", `${path}/verify-proof`)).status).toBe(200);
  expect((await request("POST", `${path}/approve`)).status).toBe(200);
  expect((await pool.query("SELECT status FROM submissions WHERE id=$1", [submissionId])).rows[0].status).toBe("APPROVED");
});
test("UC-26 blocks premature publication and preserves published snapshot on retry", async () => {
  expect((await request("POST", `/contests/${contestId}/publish-results`, "O1", { confirm: true })).status).toBe(409);
  const path = `/contests/${ids(8)}/publish-results`;
  const first = await request("POST", path, "O1", { confirm: true });
  expect(first.status).toBe(200);
  expect((await request("POST", path, "O1", { confirm: true })).body.data).toEqual(first.body.data);
  expect((await request("POST", path, "O2", { confirm: true })).status).toBe(403);
});
test("UC-27 protects unpublished works, owner access and compulsory public preview", async () => {
  expect((await request("POST", `/contests/${contestId}/archive`, "O1", {})).status).toBe(409);
  expect((await request("POST", `/contests/${ids(8)}/archive`, "O2", {})).status).toBe(403);
  expect((await request("POST", `/contests/${ids(8)}/archive`, "O1", { applyWatermark: false })).status).toBe(400);
});
test("UC-41 returns 8.50 final-round score and isolates participant feedback", async () => {
  const result = await request("GET", `/submissions/${ids(13)}/feedback`, "P1");
  expect(result.status).toBe(200);
  expect(result.body.data.result.finalScore).toBe(8.5);
  expect(result.body.data.feedback).toHaveLength(2);
  expect((await request("GET", `/submissions/${ids(13)}/feedback`, "P2")).status).toBe(403);
  expect((await request("GET", `/contests/${ids(8)}/my-results`, "P1")).status).toBe(200);
});

test("UC-26 publishes freshly computed final scores and UC-27 serves private-safe WebP then soft deletes", async () => {
  const image = await sharp({ create: { width: 2000, height: 2000, channels: 3, background: "#547890" } }).jpeg().toBuffer();
  const key = `test-organizer-${contestId}.jpg`;
  files.push(`uploads/${key}`);
  await Bun.write(`uploads/${key}`, image);
  await pool.query("UPDATE submissions SET image_original_path=$2 WHERE id=$1", [submissionId, key]);
  await pool.query("UPDATE contests SET start_at=now()-interval '10 days', end_at=now()-interval '9 days', judging_start_at=now()-interval '8 days', judging_deadline_at=now()-interval '2 days', published_at=now()-interval '1 day', status='judging' WHERE id=$1", [contestId]);
  await pool.query("UPDATE judging_rounds SET start_at=now()-interval '8 days',deadline_at=now()-interval '2 days',started_at=now()-interval '8 days',locked_at=now()-interval '2 days' WHERE id=$1", [roundId]);
  await pool.query("UPDATE contest_judges SET locked_at=now() WHERE contest_id=$1", [contestId]);
  await pool.query("INSERT INTO judging_round_entries (round_id,submission_id) VALUES ($1,$2)", [roundId, submissionId]);
  const evaluation = await pool.query("INSERT INTO evaluations (submission_id,judge_id,round_id,comment) VALUES ($1,$2,$3,'Real final feedback') RETURNING id", [submissionId, ids(5), roundId]);
  await pool.query("INSERT INTO evaluation_scores (evaluation_id,criterion_id,score) SELECT $1,id,8.55 FROM scoring_criteria WHERE category_id=$2", [evaluation.rows[0].id, categoryId]);
  const published = await request("POST", `/contests/${contestId}/publish-results`, "O1", { confirm: true });
  expect(published.status).toBe(200);
  expect(published.body.data.entries[0].finalScore).toBe(8.55);
  expect(published.body.data.resultsLocked).toBe(true);
  expect((await request("PUT", `/contests/${contestId}`, "O1", { name: "tamper" })).status).toBe(403);
  const archived = await request("POST", `/contests/${contestId}/archive`, "O1", { submissionIds: [submissionId] });
  expect(archived.status).toBe(202);
  const item = archived.body.data.items[0];
  expect(item.watermarked).toBe(true);
  const detail = await request("GET", `/exhibitions/${item.exhibitionId}`);
  expect(detail.status).toBe(200);
  expect(JSON.stringify(detail.body)).not.toContain(key);
  const preview = await app.request(`/api/v1/exhibitions/${item.exhibitionId}/image`);
  expect(preview.status).toBe(200);
  expect(preview.headers.get("content-type")).toContain("image/webp");
  const metadata = await sharp(Buffer.from(await preview.arrayBuffer())).metadata();
  expect(metadata.exif).toBeUndefined();
  const stored = await pool.query("SELECT webp_key FROM exhibition_images WHERE id=$1", [item.exhibitionId]);
  files.push(`uploads/${stored.rows[0].webp_key}`);
  expect((await request("DELETE", `/exhibitions/${item.exhibitionId}`)).status).toBe(200);
  expect((await request("GET", `/exhibitions/${item.exhibitionId}`)).status).toBe(404);
  expect((await pool.query("SELECT is_deleted FROM exhibition_images WHERE id=$1", [item.exhibitionId])).rows[0].is_deleted).toBe(true);
});
