import { afterAll, beforeAll, expect, test } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db";
import { lifecycleIds as ids, seedLifecycle } from "../src/db/seed/lifecycle";

beforeAll(async () => {
  const url = URL.parse(Bun.env.DATABASE_URL ?? "");
  if (!url || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/cinegen_lifecycle_verify_[a-z0-9_]+$/.test(url.pathname) || Bun.env.NODE_ENV === "production") {
    throw new Error("Use a dedicated local cinegen_lifecycle_verify_* database");
  }
  await migrate(db, { migrationsFolder: "./drizzle", migrationsSchema: "public", migrationsTable: "__drizzle_migrations" });
  await seedLifecycle();
});
afterAll(() => pool.end());

test("fixtures support open/closed/draft contest acceptance with valid schedules", async () => {
  const { rows } = await pool.query("SELECT * FROM contests WHERE id = ANY($1::uuid[]) ORDER BY id", [[ids.C1, ids.C2, ids.C3]]);
  expect(rows.map((row) => row.status)).toEqual(["OPEN", "UNDER_REVIEW", "DRAFT"]);
  for (const row of rows) {
    expect(row.created_by).toBe(ids.O1);
    expect(row.created_by).not.toBe(ids.O2);
    const dates = [row.start_at, row.end_at, row.judging_start_at, row.judging_deadline_at, row.published_at].map(Number);
    expect(dates.every((date, index) => Number.isFinite(date) && (index === 0 || date > dates[index - 1]))).toBe(true);
  }
  expect(+rows[0].start_at < Date.now() && +rows[0].end_at > Date.now()).toBe(true);
  expect(+rows[1].end_at < Date.now()).toBe(true);
  const accounts = await pool.query("SELECT u.*, r.name AS role FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE u.id = ANY($1::uuid[]) ORDER BY u.id", [[ids.O1, ids.O2, ids.J1, ids.J2, ids.P1, ids.P2]]);
  expect(accounts.rows.map((row) => row.role)).toEqual(["Organizer", "Organizer", "Judge", "Judge", "Participant", "Participant"]);
  for (const user of accounts.rows) {
    expect(user.email_verified_at).not.toBeNull();
    expect(await Bun.password.verify("password123", user.password_hash)).toBe(true);
  }
});

test("active/inactive categories, 40/30/30 weights and two rounds are ready for acceptance", async () => {
  const sections = await pool.query("SELECT * FROM categories WHERE contest_id=$1 ORDER BY id", [ids.C1]);
  expect(sections.rows.map((row) => [row.id, row.is_active])).toEqual([[ids.CAT1, true], [ids.CAT2, false]]);
  const criteria = await pool.query("SELECT weight FROM scoring_criteria WHERE category_id=$1 ORDER BY sort_order", [ids.CAT1]);
  expect(criteria.rows.map((row) => Number(row.weight))).toEqual([0.4, 0.3, 0.3]);
  const rounds = await pool.query("SELECT * FROM judging_rounds WHERE contest_id=$1 ORDER BY position", [ids.C1]);
  expect(rounds.rows.map((row) => row.id)).toEqual([ids.R1, ids.R2]);
  expect(+rounds.rows[0].deadline_at < +rounds.rows[1].start_at).toBe(true);
  const assignments = await pool.query("SELECT round_id, count(*)::int AS total FROM contest_judges WHERE contest_id=$1 AND category_id=$2 AND is_active GROUP BY round_id", [ids.C1, ids.CAT1]);
  expect(assignments.rows).toHaveLength(2);
  expect(assignments.rows.every((row) => row.total === 2)).toBe(true);
});

test("rerunning seed preserves manual acceptance edits and creates no duplicates", async () => {
  await pool.query("UPDATE contests SET rules=$1 WHERE id=$2", ["Manual acceptance edit", ids.C3]);
  try {
    await seedLifecycle();
    const { rows } = await pool.query("SELECT rules FROM contests WHERE id=$1", [ids.C3]);
    expect(rows[0].rules).toBe("Manual acceptance edit");
    expect((await pool.query("SELECT id FROM contests WHERE id = ANY($1::uuid[])", [[ids.C1, ids.C2, ids.C3]])).rows).toHaveLength(3);
  } finally {
    await pool.query("UPDATE contests SET rules=$1 WHERE id=$2", ["Ảnh chụp bằng phim; mỗi tác phẩm tuân thủ thể lệ cuộc thi.", ids.C3]);
  }
});
