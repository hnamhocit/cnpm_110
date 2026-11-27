import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";

export const filmStocks = pgTable(
  "film_stocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    brand: varchar("brand", { length: 100 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    nominalIso: integer("nominal_iso").notNull(),
    process: varchar("process", { length: 20 }).notNull(),
    colorType: varchar("color_type", { length: 30 }).notNull(),
    supportedFormats: varchar("supported_formats", { length: 20 })
      .array()
      .notNull()
      .default(sql`ARRAY['135']::varchar[]`),
    isDxCoded: boolean("is_dx_coded").notNull().default(true),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("uq_film_stocks_brand_name_iso")
      .on(sql`LOWER(${table.brand})`, sql`LOWER(${table.name})`, table.nominalIso)
      .where(sql`${table.isDeleted} = false`),
    index("idx_film_stocks_lookup")
      .on(table.brand, table.process, table.status)
      .where(sql`${table.isDeleted} = false`),
    index("idx_film_stocks_formats").using("gin", table.supportedFormats),
    check(
      "film_stocks_iso_range",
      sql`${table.nominalIso} >= 6 AND ${table.nominalIso} <= 12800`,
    ),
    check(
      "film_stocks_process_enum",
      sql`${table.process} IN ('C-41', 'B&W', 'E-6', 'ECN-2')`,
    ),
    check(
      "film_stocks_status_enum",
      sql`${table.status} IN ('DRAFT', 'ACTIVE', 'DEPRECATED')`,
    ),
  ],
);

export const cameras = pgTable(
  "cameras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    brand: varchar("brand", { length: 100 }).notNull(),
    model: varchar("model", { length: 150 }).notNull(),
    cameraType: varchar("camera_type", { length: 30 }).notNull(),
    supportedFormat: varchar("supported_format", { length: 20 })
      .notNull()
      .default("135"),
    defaultLensMount: varchar("default_lens_mount", { length: 50 }),
    hasFixedLens: boolean("has_fixed_lens").notNull().default(false),
    fixedLensSpecs: varchar("fixed_lens_specs", { length: 150 }),
    shutterMechanism: varchar("shutter_mechanism", { length: 30 })
      .notNull()
      .default("MECHANICAL"),
    productionStartYear: integer("production_start_year"),
    productionEndYear: integer("production_end_year"),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("uq_cameras_brand_model")
      .on(sql`LOWER(${table.brand})`, sql`LOWER(${table.model})`)
      .where(sql`${table.isDeleted} = false`),
    index("idx_cameras_filter")
      .on(table.brand, table.cameraType, table.supportedFormat, table.status)
      .where(sql`${table.isDeleted} = false`),
    check(
      "cameras_status_enum",
      sql`${table.status} IN ('DRAFT', 'ACTIVE', 'DEPRECATED')`,
    ),
  ],
);

export const lenses = pgTable(
  "lenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    brand: varchar("brand", { length: 100 }).notNull(),
    model: varchar("model", { length: 150 }).notNull(),
    mountType: varchar("mount_type", { length: 50 }).notNull(),
    focalLengthMinMm: numeric("focal_length_min_mm", {
      precision: 6,
      scale: 2,
    }).notNull(),
    focalLengthMaxMm: numeric("focal_length_max_mm", {
      precision: 6,
      scale: 2,
    }),
    isPrime: boolean("is_prime").notNull().default(true),
    maxAperture: numeric("max_aperture", {
      precision: 3,
      scale: 1,
    }).notNull(),
    minAperture: numeric("min_aperture", { precision: 3, scale: 1 }),
    formatCoverage: varchar("format_coverage", { length: 20 })
      .array()
      .notNull()
      .default(sql`ARRAY['135']::varchar[]`),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("uq_lenses_brand_model_mount")
      .on(
        sql`LOWER(${table.brand})`,
        sql`LOWER(${table.model})`,
        sql`LOWER(${table.mountType})`,
      )
      .where(sql`${table.isDeleted} = false`),
    index("idx_lenses_mount_prime")
      .on(table.mountType, table.isPrime, table.status)
      .where(sql`${table.isDeleted} = false`),
    check(
      "lenses_status_enum",
      sql`${table.status} IN ('DRAFT', 'ACTIVE', 'DEPRECATED')`,
    ),
  ],
);

export const filmLabs = pgTable(
  "film_labs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 150 }).notNull(),
    countryCode: varchar("country_code", { length: 3 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    address: text("address"),
    websiteUrl: varchar("website_url", { length: 255 }),
    email: varchar("email", { length: 150 }),
    phone: varchar("phone", { length: 30 }),
    supportedProcesses: varchar("supported_processes", { length: 20 })
      .array()
      .notNull(),
    scanners: varchar("scanners", { length: 50 }).array().notNull(),
    isVerifiedPartner: boolean("is_verified_partner").notNull().default(false),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("uq_film_labs_name_city")
      .on(sql`LOWER(${table.name})`, sql`LOWER(${table.city})`, table.countryCode)
      .where(sql`${table.isDeleted} = false`),
    index("idx_film_labs_location")
      .on(table.countryCode, table.city, table.isVerifiedPartner, table.status)
      .where(sql`${table.isDeleted} = false`),
    index("idx_film_labs_processes").using("gin", table.supportedProcesses),
    index("idx_film_labs_scanners").using("gin", table.scanners),
    check(
      "film_labs_status_enum",
      sql`${table.status} IN ('DRAFT', 'ACTIVE', 'DEPRECATED')`,
    ),
  ],
);
