import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  primaryKey,
  index,
  integer,
  check,
  numeric,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";

export const contests = pgTable(
  "contests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
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

export const contestJudges = pgTable(
  "contest_judges",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),

    categoryId: uuid("category_id").notNull(),

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
    index("idx_contest_judges_judge_id").on(table.judgeId),
    index("idx_contest_judges_category_id").on(table.categoryId),
    index("idx_contest_judges_contest_id").on(table.contestId),

    uniqueIndex("uq_contest_judges_active")
      .on(table.categoryId, table.judgeId)
      .where(sql`${table.isActive} = true`),
  ],
);
