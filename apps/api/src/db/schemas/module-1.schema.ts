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
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isBanned: boolean("is_banned").notNull().default(false),
  tokenVersion: integer("token_version").notNull().default(0),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  avatarUrl: text("avatar_url"),
  profile: jsonb("profile").$type<Record<string, unknown>>().notNull().default({}),
  phoneNumber: varchar("phone_number", { length: 16 }),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  verificationRequired: boolean("verification_required").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("users_verified_phone_unique").on(table.phoneNumber)
    .where(sql`${table.phoneVerifiedAt} IS NOT NULL`),
]);

export const accountChallenges = pgTable("account_challenges", {
  accountId: uuid("account_id").notNull().references(() => users.id),
  purpose: varchar("purpose", { length: 20 }).$type<"email" | "phone" | "password_reset">().notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.accountId, table.purpose] }),
  index("idx_account_challenges_token").on(table.purpose, table.tokenHash),
]);

export const accountAuditLogs = pgTable("account_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  accountId: uuid("account_id").notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  reason: text("reason"),
  changes: jsonb("changes").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  permissionsConfigured: boolean("permissions_configured").notNull().default(false),
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

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    sessionId: uuid("session_id").notNull().defaultRandom(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_refresh_tokens_user_id").on(table.userId),
    index("idx_refresh_tokens_session_id").on(table.sessionId),
    index("idx_refresh_tokens_expires_at").on(table.expiresAt),
  ],
);
