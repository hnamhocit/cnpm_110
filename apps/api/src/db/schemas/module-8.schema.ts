import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";
import { contests, judgingRounds } from "./module-3.schema";
import { submissions } from "./module-5.schema";

export type ResultTieBreak = { categoryId: string; submissionIds: string[]; reason: string };
export type OfficialResultEntry = {
  submissionId: string;
  categoryId: string;
  categoryName: string;
  rank: number;
  finalScore: number;
  award: string | null;
  awardRank: number | null;
  awardTitle: string | null;
  prizeValueVnd: number | null;
  title: string;
  authorName: string;
  photoUrl: string | null;
  isProofVerified: boolean;
  isResultsLocked: true;
};

export const contestPublications = pgTable("contest_publications", {
  contestId: uuid("contest_id").primaryKey().references(() => contests.id, { onDelete: "restrict" }),
  roundId: uuid("round_id").notNull().references(() => judgingRounds.id, { onDelete: "restrict" }),
  contestName: varchar("contest_name", { length: 150 }).notNull(),
  publishedBy: uuid("published_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  action: varchar("action", { length: 25 }).notNull().default("PUBLISH_RESULTS"),
  tieBreaks: jsonb("tie_breaks").$type<ResultTieBreak[]>().notNull(),
  entries: jsonb("entries").$type<OfficialResultEntry[]>().notNull(),
});

/**
 * BR-17: Exhibition entries keep the private high-resolution master key and a separate optimized,
 * copyright-watermarked WebP preview. Only the preview may be served to the public gallery.
 */
export const exhibitionImages = pgTable("exhibition_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  contestId: uuid("contest_id").notNull().references(() => contests.id, { onDelete: "restrict" }),
  submissionId: uuid("submission_id").notNull().unique().references(() => submissions.id, { onDelete: "restrict" }),
  masterKey: text("master_key").notNull(),
  webpKey: text("webp_key"),
  watermarkApplied: boolean("watermark_applied").notNull().default(false),
  copyrightText: text("copyright_text"),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  errorMessage: text("error_message"),
  publishedBy: uuid("published_by").references(() => users.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_exhibition_images_contest_status").on(table.contestId, table.status),
  index("idx_exhibition_images_status").on(table.status),
  check("exhibition_images_status_valid", sql`${table.status} IN ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'PUBLISHED', 'ARCHIVED')`),
  check("exhibition_images_published_ready", sql`${table.status} <> 'PUBLISHED' OR (${table.webpKey} IS NOT NULL AND ${table.watermarkApplied} = true)`),
]);
