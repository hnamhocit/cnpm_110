import { sql } from "drizzle-orm";
import {
  pgTable,
  pgSequence,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  primaryKey,
  index,
  integer,
  jsonb,
  check,
  numeric,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";

export const contestCodeSequence = pgSequence("contest_code_seq");
const contestCodeDefault = sql`'CON-' || to_char(now() AT TIME ZONE 'UTC', 'YYYY') || '-' || to_char(nextval('contest_code_seq'), 'FM9999999999999999900')`;

export type ContestRound = { name: string; order: number; advanceCount: number | null };
export type ContestAward = { code: string; name: string; rankOrder: number; prizeValueVnd: number; quota: number };

export const contests = pgTable(
  "contests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().default(contestCodeDefault),
    theme: varchar("theme", { length: 255 }),
    rules: text("rules"),
    coverImageUrl: text("cover_image_url"),
    judgingStartAt: timestamp("judging_start_at", { withTimezone: true }),
    judgingDeadlineAt: timestamp("judging_deadline_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    rounds: jsonb("rounds").$type<ContestRound[]>().notNull().default([]),
    awards: jsonb("awards").$type<ContestAward[]>().notNull().default([]),
    description: text("description"),
    startAt: timestamp("start_at", { withTimezone: true }),
    endAt: timestamp("end_at", { withTimezone: true }),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("draft"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_contests_code").on(table.code),
    check("contests_configuration_schedule", sql`
      (${table.judgingStartAt} IS NULL AND ${table.judgingDeadlineAt} IS NULL AND ${table.publishedAt} IS NULL)
      OR (${table.startAt} IS NOT NULL AND ${table.endAt} IS NOT NULL
        AND ${table.judgingStartAt} IS NOT NULL AND ${table.judgingDeadlineAt} IS NOT NULL
        AND ${table.publishedAt} IS NOT NULL
        AND ${table.startAt} < ${table.endAt} AND ${table.endAt} < ${table.judgingStartAt}
        AND ${table.judgingStartAt} < ${table.judgingDeadlineAt} AND ${table.judgingDeadlineAt} < ${table.publishedAt})
    `),
    index("idx_contests_created_by").on(table.createdBy),
    index("idx_contests_status").on(table.status),
    index("idx_contests_is_deleted").on(table.isDeleted),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_categories_contest_id").on(table.contestId),
    uniqueIndex("uq_categories_id_contest").on(table.id, table.contestId),
    uniqueIndex("uq_categories_contest_name").on(
      table.contestId,
      table.name,
    ),
  ],
);

export const scoringCriteria = pgTable(
  "scoring_criteria",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    maxScore: numeric("max_score", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("10"),
    weight: numeric("weight", {
      precision: 5,
      scale: 4,
    })
      .notNull()
      .default("1"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_scoring_criteria_category_id").on(table.categoryId),
    check("scoring_criteria_weight_range", sql`${table.weight} > 0 AND ${table.weight} <= 1`),
    check("scoring_criteria_max_score_positive", sql`${table.maxScore} > 0`),
    uniqueIndex("uq_scoring_criteria_category_name").on(
      table.categoryId,
      table.name,
    ),
  ],
);

export const judgingRounds = pgTable("judging_rounds", {
  id: uuid("id").defaultRandom().primaryKey(),
  contestId: uuid("contest_id").notNull().references(() => contests.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 150 }).notNull(),
  position: integer("position").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
  advanceCount: integer("advance_count"),
  requiredJudges: integer("required_judges").notNull().default(1),
  startedAt: timestamp("started_at", { withTimezone: true }),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_round_contest_position").on(table.contestId, table.position),
  uniqueIndex("uq_round_id_contest").on(table.id, table.contestId),
  uniqueIndex("uq_round_active_contest").on(table.contestId)
    .where(sql`${table.startedAt} is not null and ${table.lockedAt} is null`),
  check("judging_round_values", sql`${table.position} > 0 and ${table.startAt} < ${table.deadlineAt}
    and ${table.requiredJudges} > 0 and (${table.advanceCount} is null or ${table.advanceCount} > 0)`),
]);

export const contestJudges = pgTable(
  "contest_judges",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),

    categoryId: uuid("category_id").notNull(),
    roundId: uuid("round_id"),

    judgeId: uuid("judge_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    isActive: boolean("is_active").notNull().default(true),

    lockedAt: timestamp("locked_at", {
      withTimezone: true,
    }),

    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "contest_judges_category_contest_fk",
      columns: [table.categoryId, table.contestId],
      foreignColumns: [categories.id, categories.contestId],
    }).onDelete("restrict"),
    foreignKey({
      name: "contest_judges_round_contest_fk",
      columns: [table.roundId, table.contestId],
      foreignColumns: [judgingRounds.id, judgingRounds.contestId],
    }).onDelete("restrict"),
    uniqueIndex("uq_contest_judges_round_active").on(table.roundId, table.categoryId, table.judgeId)
      .where(sql`${table.roundId} is not null and ${table.isActive} = true`),
    index("idx_contest_judges_judge_id").on(table.judgeId),
    index("idx_contest_judges_category_id").on(table.categoryId),
    index("idx_contest_judges_contest_id").on(table.contestId),

    uniqueIndex("uq_contest_judges_active")
      .on(table.categoryId, table.judgeId)
      .where(sql`${table.roundId} is null and ${table.isActive} = true`),
  ],
);
