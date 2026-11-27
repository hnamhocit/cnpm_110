import { afterAll, beforeAll, expect, test } from "bun:test";
import sharp from "sharp";
import { unlink } from "node:fs/promises";
import { sign } from "hono/jwt";
import { pool } from "../src/db";
import { deliverNotificationEmails } from "../src/services/notification-delivery";
import contests from "../src/routes/contests.route";
import submissions from "../src/routes/submissions.route";
import exhibitions from "../src/routes/exhibitions.route";
import judge from "../src/routes/judge.route";
import ai from "../src/routes/ai-webhook.route";
import { createTestApp } from "./helpers/test-app";

// Use the dedicated acceptance database. Every mutation targets a newly created contest.
const app = createTestApp();
app.route("/api/v1/contests", contests);
app.route("/api/v1/submissions", submissions);
app.route("/api/v1/exhibitions", exhibitions);
app.route("/api/v1/judge", judge);
app.route("/api/v1/ai", ai);
const secret = "organizer-usecases-integration-secret-32-characters";
const ids = (n: number) => `accede00-0000-4000-8000-${String(n).padStart(12, "0")}`;
const created: string[] = [];
const files: string[] = [];
const temporaryUsers: string[] = [];
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
  await pool.query("DELETE FROM audit_logs WHERE resource_id = ANY($1::uuid[]) OR new_value->>'contest_id' = ANY($1::text[]) OR old_value->>'contest_id' = ANY($1::text[])", [created]);
  for (const id of temporaryUsers) await pool.query("DELETE FROM users WHERE id=$1", [id]);
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
  const otherNotes = await request("GET", "/submissions/my/notifications", "P2");
  expect(otherNotes.body.data.some((n: { data: { submissionId: string } }) => n.data.submissionId === submissionId)).toBe(false);
  const notification = (await pool.query("SELECT id FROM contest_notifications WHERE contest_id=$1 AND kind='PROOF_REQUESTED'", [contestId])).rows[0].id;
  const queued = await pool.query("SELECT recipient,status FROM notification_emails WHERE notification_id=$1", [notification]);
  expect(queued.rows[0].recipient).toBe("acceptance.p1@example.com");
  expect(queued.rows[0].status).toBe("PENDING");
  expect(await deliverNotificationEmails(async () => { throw new Error("SMTP secret should be hidden"); }, 1, notification)).toEqual({ sent: 0, failed: 1 });
  const failed = (await pool.query("SELECT * FROM notification_emails WHERE notification_id=$1", [notification])).rows[0];
  expect(failed.status).toBe("FAILED");
  expect(failed.last_error).not.toContain("secret");
  const messages: string[] = [];
  expect(await deliverNotificationEmails(async (to, subject, text) => { messages.push(to + subject + text); }, 1, notification)).toEqual({ sent: 1, failed: 0 });
  expect(messages[0]).toContain(submissionId);
  expect(messages[0]).toContain("2090-01-02T02:00:00.000Z");
  expect(await deliverNotificationEmails(async () => { throw new Error("must not resend"); }, 1, notification)).toEqual({ sent: 0, failed: 0 });
  const audits = (await pool.query("SELECT * FROM audit_logs WHERE resource_id=$1 AND action='UPDATE'", [submissionId])).rows;
  expect(audits.some((row) => row.actor_id===ids(1) && row.old_value.status==='VERIFIED' && row.new_value.status==='PROOF_REQUESTED')).toBe(true);
  expect(audits.some((row) => row.actor_id===ids(2))).toBe(false);

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
  await pool.query("UPDATE judging_rounds SET start_at=now()-interval '8 days',deadline_at=now()-interval '2 days',started_at=now()-interval '8 days',locked_at=NULL WHERE id=$1", [roundId]);
  await pool.query("UPDATE contest_judges SET locked_at=now() WHERE contest_id=$1", [contestId]);
  await pool.query("INSERT INTO judging_round_entries (round_id,submission_id) VALUES ($1,$2)", [roundId, submissionId]);
  const evaluation = await pool.query("INSERT INTO evaluations (submission_id,judge_id,round_id,comment) VALUES ($1,$2,$3,'Real final feedback') RETURNING id", [submissionId, ids(5), roundId]);
  await pool.query("INSERT INTO evaluation_scores (evaluation_id,criterion_id,score) SELECT $1,id,8.55 FROM scoring_criteria WHERE category_id=$2", [evaluation.rows[0].id, categoryId]);
  expect((await request("GET", `/contests/${contestId}/judging-progress`, "O2")).status).toBe(403);
  const progress = await request("GET", `/contests/${contestId}/judging-progress`);
  expect(progress.status).toBe(200);
  expect(progress.body.data.overall.totalScored).toBe(1);
  expect((await request("POST", `/contests/${contestId}/close-judging`, "O2")).status).toBe(403);
  await pool.query("UPDATE contest_judges SET locked_at=NULL WHERE contest_id=$1", [contestId]);
  expect((await request("POST", `/contests/${contestId}/close-judging`)).status).toBe(409);
  await pool.query("UPDATE contest_judges SET locked_at=now() WHERE contest_id=$1", [contestId]);
  const closed = await request("POST", `/contests/${contestId}/close-judging`);
  expect(closed.status).toBe(200);
  expect((await request("POST", `/contests/${contestId}/close-judging`)).body.data.alreadyLocked).toBe(true);
  expect((await pool.query("SELECT status FROM contests WHERE id=$1", [contestId])).rows[0].status).toBe("judging");
  expect((await pool.query("SELECT * FROM contest_publications WHERE contest_id=$1", [contestId])).rows).toHaveLength(0);
  const published = await request("POST", `/contests/${contestId}/publish-results`, "O1", { confirm: true });
  expect(published.status).toBe(200);
  expect(published.body.data.entries[0].finalScore).toBe(8.55);
  expect(published.body.data.resultsLocked).toBe(true);
  const publications = (await pool.query("SELECT * FROM contest_notifications WHERE contest_id=$1 AND kind='RESULTS_PUBLISHED'", [contestId])).rows;
  expect(publications).toHaveLength(1);
  expect(publications[0].recipient_id).toBe(ids(3));
  const publicationAudit = (await pool.query("SELECT * FROM audit_logs WHERE resource_type='contest_publications' AND resource_id=$1", [contestId])).rows;
  expect(publicationAudit.some((row) => row.actor_id===ids(1) && row.new_value.entries[0].finalScore===8.55)).toBe(true);

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

test("UC-24/25 isolates rounds and advances only the configured highest scoring entry", async () => {
  const response = await request("POST", "/contests", "O1", { name: "Multi-round regression", ...schedule });
  const id = response.body.data.id;
  created.push(id);
  const category = (await request("POST", `/contests/${id}/categories`, "O1", { name: "Film" })).body.data.id;
  await request("PUT", `/contests/${id}/categories/${category}/criteria`, "O1", { criteria: [{ name: "Quality", weight: 1 }] });
  const first = (await request("POST", `/contests/${id}/rounds`, "O1", { name: "First", position: 1, startAt: schedule.judgingStartAt, deadlineAt: "2090-01-03T12:00:00+07:00", advanceCount: 1 })).body.data.id;
  const final = (await request("POST", `/contests/${id}/rounds`, "O1", { name: "Final", position: 2, startAt: "2090-01-03T13:00:00+07:00", deadlineAt: schedule.judgingDeadlineAt, advanceCount: null })).body.data.id;
  for (const round of [first, final]) {
    expect((await request("POST", `/contests/${id}/judges`, "O1", { roundId: round, categoryId: category, judgeId: ids(5) })).status).toBe(200);
  }
  await pool.query("UPDATE contests SET status='judging' WHERE id=$1", [id]);
  await pool.query("UPDATE judging_rounds SET started_at=now() WHERE id=$1", [first]);
  await pool.query("UPDATE contest_judges SET locked_at=now() WHERE round_id=$1", [first]);
  const entrants: string[] = [];
  for (const score of [9, 7]) {
    const sub = (await pool.query("INSERT INTO submissions(contest_id,category_id,participant_id,title,image_original_path,status) VALUES ($1,$2,$3,'Entry','test.jpg','APPROVED') RETURNING id", [id, category, ids(3)])).rows[0].id;
    entrants.push(sub);
    await pool.query("INSERT INTO judging_round_entries VALUES ($1,$2)", [first, sub]);
    const criterionId = (await pool.query("SELECT id FROM scoring_criteria WHERE category_id=$1", [category])).rows[0].id;
    await pool.query("UPDATE contest_judges SET locked_at=NULL WHERE round_id=$1", [first]);
    const scored = await request("POST", `/judge/submissions/${sub}/evaluation`, "J1", { scores: [{ criterionId, score }], comment: "N132 judge audit" });
    expect(scored.status).toBe(200);
    const audit = (await pool.query("SELECT * FROM audit_logs WHERE resource_type='evaluations' AND new_value->>'submission_id'=$1", [sub])).rows;
    expect(audit.some((row) => row.actor_id===ids(5) && row.new_value.comment==='N132 judge audit')).toBe(true);
    await pool.query("UPDATE contest_judges SET locked_at=now() WHERE round_id=$1", [first]);
  }
  expect((await request("POST", `/contests/${id}/close-judging?roundId=${first}`)).status).toBe(200);
  const advanced = await pool.query("SELECT submission_id FROM judging_round_entries WHERE round_id=$1", [final]);
  expect(advanced.rows.map((row) => row.submission_id)).toEqual([entrants[0]]);
  const progress = await request("GET", `/contests/${id}/judging-progress?roundId=${final}`);
  expect(progress.body.data.overall.totalAssigned).toBe(1);
  expect(progress.body.data.overall.totalScored).toBe(0);
  expect(progress.body.data.overall.allLocked).toBe(false);
  expect((await request("POST", `/contests/${id}/close-judging?roundId=${final}`)).status).toBe(409);
});

test("N132 audit actor, old/new values, reason, no success for rejected owner and recursive secret redaction", async () => {
  const rows = (await pool.query("SELECT * FROM audit_logs WHERE resource_id=$1 ORDER BY created_at", [contestId])).rows;
  expect(rows.some((row) => row.action === "INSERT" && row.actor_id === ids(1))).toBe(true);
  expect(rows.some((row) => row.action === "UPDATE" && row.old_value.name === "UC integration" && row.new_value.name === "updated")).toBe(true);
  expect(rows.some((row) => row.actor_id===ids(2))).toBe(false);
  const moderation = (await pool.query("SELECT * FROM audit_logs WHERE resource_type='submission_moderation_logs' AND new_value->>'submission_id'=$1", [submissionId])).rows;
  expect(moderation.some((row) => row.actor_id===ids(1) && row.new_value.action==='VERIFY_PROOF' && row.reason)).toBe(true);
  const redacted = (await pool.query(`SELECT audit_safe_json('{"password":"p","nested":{"accessToken":"t","secret":"s","safe":"ok"}}'::jsonb) AS value`)).rows[0].value;
  expect(redacted).toEqual({ nested: { safe: "ok" } });
  const decision = (await pool.query("SELECT * FROM contest_notifications WHERE contest_id=$1 AND kind='SUBMISSION_STATUS'", [contestId])).rows;
  expect(decision).toHaveLength(1);
  expect(decision[0].recipient_id).toBe(ids(3));
  expect(decision[0].data.status).toBe("APPROVED");
  expect((await request("GET", "/submissions/my/notifications", "J1")).status).toBe(403);
});

test.skipIf(!process.env.LIVE_SMTP_TO)("N132-01 real SMTP proof email to authorized test inbox", async () => {
  const email = process.env.LIVE_SMTP_TO!;
  if (email !== "hnamhocit@gmail.com") throw new Error("Live test recipient must be explicitly authorized");
  const inserted = await pool.query("INSERT INTO users(full_name,email,password_hash,is_active) VALUES ('FPC-132 SMTP acceptance',$1,'not-a-login-password',true) ON CONFLICT(email) DO NOTHING RETURNING id", [email]);
  if (inserted.rows[0]) temporaryUsers.push(inserted.rows[0].id);
  const participant = (await pool.query("SELECT id FROM users WHERE email=$1", [email])).rows[0].id;
  const contest = (await request("POST", "/contests", "O1", { name: "FPC-132 SMTP acceptance" })).body.data.id;
  created.push(contest);
  const category = (await request("POST", `/contests/${contest}/categories`, "O1", { name: "SMTP proof" })).body.data.id;
  const submission = (await pool.query("INSERT INTO submissions(contest_id,category_id,participant_id,title,image_original_path,status) VALUES ($1,$2,$3,'FPC-132 SMTP proof','test.jpg','VERIFIED') RETURNING id", [contest, category, participant])).rows[0].id;
  const deadline = new Date(Date.now()+86400000).toISOString();
  expect((await request("POST", `/submissions/${submission}/request-proof`, "O1", { proofType: "contact_sheet", proofDeadlineAt: deadline, reason: "FPC-132 nghiệm thu SMTP thật" })).status).toBe(200);
  const notification = (await pool.query("SELECT id FROM contest_notifications WHERE contest_id=$1", [contest])).rows[0].id;
  expect(await deliverNotificationEmails(undefined, 1, notification)).toEqual({ sent: 1, failed: 0 });
  const delivery = (await pool.query("SELECT status,sent_at FROM notification_emails WHERE notification_id=$1", [notification])).rows[0];
  expect(delivery.status).toBe("SENT");
  expect(delivery.sent_at).not.toBeNull();
  console.log("FPC-132 real SMTP accepted", { recipient: email, submission, deadline });
});

test("N132-04/05/06/12/14 rejects invalid decisions, preserves overdue proof and audits AI integration", async () => {
  const id = (await request("POST", "/contests", "O1", { name: "FPC-132 deadline and audit" })).body.data.id;
  created.push(id);
  const category = (await request("POST", `/contests/${id}/categories`, "O1", { name: "Proof" })).body.data.id;
  const sub = (await pool.query("INSERT INTO submissions(contest_id,category_id,participant_id,title,image_original_path,status) VALUES ($1,$2,$3,'Expiry check','test.jpg','VERIFIED') RETURNING id", [id, category, ids(3)])).rows[0].id;
  Bun.env.AI_WEBHOOK_SECRET = "fpc132-integration-webhook-secret";
  const webhook = await app.request("/api/v1/ai/webhook", { method: "POST", headers: { "Content-Type": "application/json", "X-Webhook-Secret": Bun.env.AI_WEBHOOK_SECRET }, body: JSON.stringify({ submissionId: sub, phashHex: "12345678abcdef09", aiGeneratedProbability: 0.1, predictedTags: [] }) });
  expect(webhook.status).toBe(200);
  const aiAudit = (await pool.query("SELECT * FROM audit_logs WHERE resource_type='submission_ai_analyses' AND new_value->>'submission_id'=$1", [sub])).rows;
  expect(aiAudit).toHaveLength(1);
  expect(aiAudit[0].new_value.ai_generated_probability).toBe(0.1);
  const body = { proofType: "negative", proofDeadlineAt: new Date(Date.now()+86400000).toISOString(), reason: "Verify negative" };
  expect((await request("POST", `/submissions/${sub}/request-proof`, "O2", body)).status).toBe(404);
  expect((await pool.query("SELECT * FROM contest_notifications WHERE contest_id=$1", [id])).rows).toHaveLength(0);
  expect((await request("POST", `/submissions/${sub}/request-proof`, "O1", body)).status).toBe(200);
  await pool.query("UPDATE submissions SET proof_deadline_at=now()-interval '1 hour' WHERE id=$1", [sub]);
  const detail = await request("GET", `/submissions/${sub}`, "P1");
  expect(detail.body.data.proofStatus).toBe("OVERDUE");
  expect(detail.body.data.status).toBe("PROOF_REQUESTED");
  const logsBefore = (await pool.query("SELECT count(*) FROM audit_logs WHERE resource_id=$1", [sub])).rows[0].count;
  expect((await request("POST", `/submissions/${sub}/reject`, "O1", {})).status).toBe(422);
  expect((await pool.query("SELECT count(*) FROM audit_logs WHERE resource_id=$1", [sub])).rows[0].count).toBe(logsBefore);
  expect((await request("POST", `/submissions/${sub}/reject`, "O1", { reason: "Missing requested proof" })).status).toBe(200);
  const decision = (await pool.query("SELECT * FROM contest_notifications WHERE contest_id=$1 AND kind='SUBMISSION_STATUS'", [id])).rows;
  expect(decision).toHaveLength(1);
  expect(decision[0].recipient_id).toBe(ids(3));
  expect(decision[0].data.reason).toBe("Missing requested proof");
  const audit = (await pool.query("SELECT * FROM audit_logs WHERE resource_id=$1 AND actor_id=$2 ORDER BY created_at DESC", [sub, ids(1)])).rows;
  expect(audit.some((row) => row.new_value.status==='DISQUALIFIED' && row.reason==='Missing requested proof')).toBe(true);
});
