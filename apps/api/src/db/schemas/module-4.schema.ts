import { sql } from "drizzle-orm";
import {
  pgTable,
  pgSequence,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  numeric,
  index,
  uniqueIndex,
  integer,
  check,
} from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";
import { cameras, filmLabs, filmStocks, lenses } from "./module-2.schema";

export const rollCodeSequence = pgSequence("film_roll_code_seq");
const rollCodeDefault = sql`'ROLL-' || to_char(now() AT TIME ZONE 'UTC', 'YYYY') || '-' || lpad(nextval('film_roll_code_seq')::text, 4, '0')`;

export const filmRolls = pgTable(
  "film_rolls",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rollCode: varchar("roll_code", { length: 50 })
      .notNull()
      .default(rollCodeDefault),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    filmStockId: uuid("film_stock_id").references(() => filmStocks.id, {
      onDelete: "restrict",
    }),
    customFilmName: varchar("custom_film_name", { length: 150 }),
    format: varchar("format", { length: 30 }).notNull().default("135"),
    isoRated: integer("iso_rated").notNull(),
    isoShot: integer("iso_shot").notNull(),
    cameraId: uuid("camera_id").references(() => cameras.id, {
      onDelete: "restrict",
    }),
    customCameraName: varchar("custom_camera_name", { length: 150 }),
    labId: uuid("lab_id").references(() => filmLabs.id, {
      onDelete: "restrict",
    }),
    customLabName: varchar("custom_lab_name", { length: 150 }),
    devProcess: varchar("dev_process", { length: 30 }).notNull().default("C-41"),
    loadDate: date("load_date").notNull(),
    devDate: date("dev_date"),
    status: varchar("status", { length: 30 }).notNull().default("SHOOTING"),
    negativeProofAssetId: uuid("negative_proof_asset_id"),
    notes: text("notes"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_film_rolls_roll_code")
      .on(table.rollCode)
      .where(sql`${table.isDeleted} = false`),
    index("idx_film_rolls_user_id")
      .on(table.userId)
      .where(sql`${table.isDeleted} = false`),
    index("idx_film_rolls_status").on(table.status),
    check("film_rolls_iso_rated_positive", sql`${table.isoRated} > 0`),
    check("film_rolls_iso_shot_positive", sql`${table.isoShot} > 0`),
    check(
      "film_rolls_status_enum",
      sql`${table.status} IN ('SHOOTING', 'DEVELOPED', 'SCANNED', 'ARCHIVED')`,
    ),
  ],
);

export const frameLogs = pgTable(
  "frame_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rollId: uuid("roll_id")
      .notNull()
      .references(() => filmRolls.id, { onDelete: "restrict" }),
    frameNumber: integer("frame_number").notNull(),
    lensId: uuid("lens_id").references(() => lenses.id, {
      onDelete: "restrict",
    }),
    customLensName: varchar("custom_lens_name", { length: 150 }),
    focalLengthMm: integer("focal_length_mm"),
    aperture: varchar("aperture", { length: 15 }),
    shutterSpeed: varchar("shutter_speed", { length: 20 }),
    exposureCompensation: varchar("exposure_compensation", { length: 10 }),
    filterUsed: varchar("filter_used", { length: 50 }),
    locationName: varchar("location_name", { length: 255 }),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    shotAt: timestamp("shot_at", { withTimezone: true }),
    scannedImageAssetId: uuid("scanned_image_asset_id"),
    notes: text("notes"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_roll_frame_number")
      .on(table.rollId, table.frameNumber)
      .where(sql`${table.isDeleted} = false`),
    index("idx_frame_logs_roll_id").on(table.rollId),
    check("frame_logs_number_positive", sql`${table.frameNumber} > 0`),
  ],
);
