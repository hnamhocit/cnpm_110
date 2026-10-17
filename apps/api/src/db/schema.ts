
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

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    // Bổ sung FK đến categories.id khi tích hợp FPC-28.
    categoryId: uuid("category_id").notNull(),

    filmRollId: uuid("film_roll_id")
      .notNull()
      .references(() => filmRolls.id, { onDelete: "restrict" }),

    title: varchar("title", { length: 200 }).notNull(),

    description: text("description"),

    imageKey: text("image_key").notNull(),

    proofKey: text("proof_key"),

    status: varchar("status", { length: 20 })
      .notNull()
      .default("draft"),

    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_submissions_user_id").on(table.userId),

    index("idx_submissions_category_id").on(table.categoryId),

    index("idx_submissions_film_roll_id").on(table.filmRollId),

    index("idx_submissions_status").on(table.status),

    check(
      "submissions_status_valid",
      sql`${table.status} IN (
        'draft', 'submitted', 'approved', 'rejected'
      )`,
    ),

    check(
      "submissions_title_not_empty",
      sql`length(trim(${table.title})) > 0`,
    ),

    check(
      "submissions_image_key_not_empty",
      sql`length(trim(${table.imageKey})) > 0`,
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

    camera: varchar("camera", { length: 150 }),

    lens: varchar("lens", { length: 150 }),

    aperture: varchar("aperture", { length: 30 }),

    shutterSpeed: varchar("shutter_speed", { length: 30 }),

    focalLengthMm: integer("focal_length_mm"),

    frameNumber: integer("frame_number"),

    labName: varchar("lab_name", { length: 150 }),

    scanDetails: text("scan_details"),

    capturedAt: timestamp("captured_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "film_metadata_focal_length_positive",
      sql`${table.focalLengthMm} > 0`,
    ),

    check(
      "film_metadata_frame_number_non_negative",
      sql`${table.frameNumber} >= 0`,
    ),
  ],
);