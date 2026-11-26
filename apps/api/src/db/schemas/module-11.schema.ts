import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { contestNotifications } from "./module-5.schema";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id"),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(),
  action: text("action").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("idx_audit_resource").on(table.resourceType, table.resourceId, table.createdAt)]);

export const notificationEmails = pgTable("notification_emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  notificationId: uuid("notification_id").notNull().unique().references(() => contestNotifications.id, { onDelete: "cascade" }),
  recipient: text("recipient").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
