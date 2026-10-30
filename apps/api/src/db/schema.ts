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
  bigint,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("idx_user_roles_role_id").on(table.roleId),
  ],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("idx_role_permissions_permission_id").on(table.permissionId),
  ],
);


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
      scale: 2,
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
    uniqueIndex("uq_scoring_criteria_category_name").on(
      table.categoryId,
      table.name,
    ),
  ],
);

export const filmRolls = pgTable(
  "film_rolls",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    filmStock: varchar("film_stock", { length: 150 }).notNull(),

    iso: integer("iso").notNull(),

    format: varchar("format", { length: 50 }).notNull(),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_film_rolls_user_id").on(table.userId),
    check("film_rolls_iso_positive", sql`${table.iso} > 0`),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "restrict" }),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),

    participantId: uuid("participant_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    title: varchar("title", { length: 255 }).notNull(),

    description: text("description"),

    imageOriginalPath: text("image_original_path").notNull(),

    imagePreviewPath: text("image_preview_path"),

    negativeProofPath: text("negative_proof_path"),

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
    index("idx_submissions_contest_id").on(table.contestId),
    index("idx_submissions_category_id").on(table.categoryId),
    index("idx_submissions_participant_id").on(table.participantId),
    index("idx_submissions_status").on(table.status),

    check(
      "submissions_status_valid",
      sql`${table.status} IN (
        'PENDING_AI', 'FLAGGED', 'APPROVED', 'DISQUALIFIED'
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

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_refresh_tokens_user_id").on(table.userId),
    index("idx_refresh_tokens_expires_at").on(table.expiresAt),
  ],
);
