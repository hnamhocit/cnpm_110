import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  primaryKey,
  index,
  integer,
  jsonb,
  check,
  foreignKey,
  bigint,
} from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";
import { categories, contests } from "./module-3.schema";

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "restrict" }),

    categoryId: uuid("category_id").notNull(),

    participantId: uuid("participant_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    title: varchar("title", { length: 255 }).notNull(),

    description: text("description"),

    rejectionReason: text("rejection_reason"),

    imageOriginalPath: text("image_original_path").notNull(),

    imagePreviewPath: text("image_preview_path"),

    negativeProofPath: text("negative_proof_path"),
    proofType: varchar("proof_type", { length: 20 }).$type<"negative" | "contact_sheet">(),
    proofRequestedAt: timestamp("proof_requested_at", { withTimezone: true }),
    proofDeadlineAt: timestamp("proof_deadline_at", { withTimezone: true }),
    proofVerifiedAt: timestamp("proof_verified_at", { withTimezone: true }),
    proofVerifiedBy: uuid("proof_verified_by").references(() => users.id, { onDelete: "restrict" }),

    fileSizeBytes: bigint("file_size_bytes", { mode: "bigint" }),

    width: integer("width"),

    height: integer("height"),

    status: varchar("status", { length: 30 })
      .notNull()
      .default("PENDING_AI"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "submissions_category_contest_fk",
      columns: [table.categoryId, table.contestId],
      foreignColumns: [categories.id, categories.contestId],
    }).onDelete("restrict"),
    check("submission_proof_type_valid", sql`${table.proofType} is null or ${table.proofType} in ('negative', 'contact_sheet')`),
    index("idx_submissions_contest_id").on(table.contestId),
    index("idx_submissions_category_id").on(table.categoryId),
    index("idx_submissions_participant_id").on(table.participantId),
    index("idx_submissions_status").on(table.status),
    check(
      "submissions_status_valid",
      sql`${table.status} IN (
    'PENDING_AI',
    'PROOF_REQUESTED',
    'PROOF_SUBMITTED',
    'VERIFIED',
    'SUSPICIOUS',
    'FLAGGED',
    'APPROVED',
    'DISQUALIFIED'
  )`,
    ),


    check(
      "submissions_title_not_empty",
      sql`length(trim(${table.title})) > 0`,
    ),

    check(
      "submissions_original_path_not_empty",
      sql`length(trim(${table.imageOriginalPath})) > 0`,
    ),

    check(
      "submissions_file_size_positive",
      sql`${table.fileSizeBytes} > 0`,
    ),

    check(
      "submissions_width_positive",
      sql`${table.width} > 0`,
    ),

    check(
      "submissions_height_positive",
      sql`${table.height} > 0`,
    ),
  ],
);

export const filmMetadata = pgTable(
  "film_metadata",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    submissionId: uuid("submission_id")
      .notNull()
      .unique()
      .references(() => submissions.id, {
        onDelete: "cascade",
      }),

    filmBrand: varchar("film_brand", { length: 100 }).notNull(),

    filmStock: varchar("film_stock", { length: 150 }).notNull(),

    filmFormat: varchar("film_format", { length: 50 }).notNull(),

    isoRated: integer("iso_rated").notNull(),

    isoShot: integer("iso_shot").notNull(),

    cameraBody: varchar("camera_body", { length: 150 }).notNull(),

    lens: varchar("lens", { length: 150 }),

    rollId: varchar("roll_id", { length: 100 }),

    frameNumber: varchar("frame_number", { length: 20 }),

    devLabName: varchar("dev_lab_name", { length: 150 }),

    devChemistry: varchar("dev_chemistry", { length: 50 }),

    scannerModel: varchar("scanner_model", { length: 150 }),
  },
  (table) => [
    check(
      "film_metadata_iso_rated_positive",
      sql`${table.isoRated} > 0`,
    ),

    check(
      "film_metadata_iso_shot_positive",
      sql`${table.isoShot} > 0`,
    ),
  ],
);

export const submissionModerationLogs = pgTable(
  "submission_moderation_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    moderatorId: uuid("moderator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 50 }).notNull(),
    reason: text("reason").notNull(),
    previousStatus: varchar("previous_status", { length: 40 }).notNull(),
    newStatus: varchar("new_status", { length: 40 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_moderation_logs_submission_id").on(table.submissionId),
    index("idx_moderation_logs_moderator_id").on(table.moderatorId),
  ],
);

export const contestNotifications = pgTable("contest_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  contestId: uuid("contest_id").notNull().references(() => contests.id, { onDelete: "restrict" }),
  kind: varchar("kind", { length: 40 }).notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("idx_contest_notifications_recipient").on(table.recipientId, table.createdAt)]);
