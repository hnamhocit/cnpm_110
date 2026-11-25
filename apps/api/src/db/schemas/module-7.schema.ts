import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index,
  check,
  numeric,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";
import { scoringCriteria } from "./module-3.schema";
import { submissions } from "./module-5.schema";

export const evaluations = pgTable(
  "evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),

    judgeId: uuid("judge_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    comment: text("comment"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_evaluations_submission_judge").on(
      table.submissionId,
      table.judgeId,
    ),
    index("idx_evaluations_judge_id").on(table.judgeId),
    index("idx_evaluations_submission_id").on(table.submissionId),
  ],
);

export const evaluationScores = pgTable(
  "evaluation_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    evaluationId: uuid("evaluation_id")
      .notNull()
      .references(() => evaluations.id, { onDelete: "cascade" }),

    criterionId: uuid("criterion_id")
      .notNull()
      .references(() => scoringCriteria.id, { onDelete: "restrict" }),

    score: numeric("score", {
      precision: 5,
      scale: 2,
    }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_evaluation_scores_evaluation_criterion").on(
      table.evaluationId,
      table.criterionId,
    ),
    index("idx_evaluation_scores_criterion_id").on(table.criterionId),
    check(
      "evaluation_scores_score_non_negative",
      sql`${table.score} >= 0`,
    ),
  ],
);
