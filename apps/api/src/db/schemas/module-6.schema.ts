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
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { submissions } from "./module-5.schema";

export const submissionAiAnalyses = pgTable(
  "submission_ai_analyses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .unique()
      .references(() => submissions.id, { onDelete: "cascade" }),
    phashHex: varchar("phash_hex", { length: 16 }),
    aiGeneratedProbability: numeric("ai_generated_probability", {
      precision: 5,
      scale: 4,
    }).notNull(),
    isAiFlagged: boolean("is_ai_flagged").notNull().default(false),
    duplicateSuspectId: uuid("duplicate_suspect_id").references(
      () => submissions.id,
      { onDelete: "set null" },
    ),
    duplicateSimilarityScore: numeric("duplicate_similarity_score", {
      precision: 5,
      scale: 4,
    }),
    filmGrainScore: numeric("film_grain_score", { precision: 5, scale: 4 }),
    predictedTags: jsonb("predicted_tags").notNull().default([]),
    flagReasons: jsonb("flag_reasons").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_ai_analyses_submission_id").on(table.submissionId),
    index("idx_ai_analyses_is_flagged").on(table.isAiFlagged),
  ],
);

export const aiAnalysisJobs = pgTable(
  "ai_analysis_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    submissionId: uuid("submission_id")
      .notNull()
      .unique()
      .references(() => submissions.id, {
        onDelete: "cascade",
      }),

    status: varchar("status", { length: 20 })
      .notNull()
      .default("PENDING"),

    attempts: integer("attempts")
      .notNull()
      .default(0),

    maxAttempts: integer("max_attempts")
      .notNull()
      .default(3),

    lastError: text("last_error"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_ai_analysis_jobs_status").on(table.status),
  ],
);
