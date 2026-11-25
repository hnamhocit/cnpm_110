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
  check,
} from "drizzle-orm/pg-core";
import { users } from "./module-1.schema";

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
