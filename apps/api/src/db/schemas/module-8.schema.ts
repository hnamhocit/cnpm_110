import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";
import { contests, judgingRounds } from "./module-3.schema";

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
