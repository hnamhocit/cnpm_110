import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "../db";
import { accountAuditLogs, users } from "../db/schemas/module-1.schema";
import { auditLogs } from "../db/schemas/module-11.schema";
import { submissionModerationLogs } from "../db/schemas/module-5.schema";
import {
  sanitizeAuditData,
  validateAuditLogQuery,
  type AuditLogQuery,
} from "./audit-logs.validation";

export { sanitizeAuditData, validateAuditLogQuery, type AuditLogQuery };

export async function recordAuditLog(entry: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  reason?: string | null;
}) {
  const [created] = await db
    .insert(auditLogs)
    .values({
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.entityType,
      resourceId: entry.entityId,
      oldValue: sanitizeAuditData(entry.beforeData),
      newValue: sanitizeAuditData(entry.afterData),
      reason: entry.reason ?? null,
    })
    .returning();
  return created;
}

export interface UnifiedAuditLogItem {
  id: string;
  source: "system" | "account" | "moderation";
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  ipAddress: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  reason: string | null;
  createdAt: string;
}

export async function listAuditLogs(rawQuery: AuditLogQuery) {
  const query = validateAuditLogQuery(rawQuery);
  const fetchCap = query.page * query.limit;

  const sysConds: SQL[] = [];
  if (query.actorId) sysConds.push(eq(auditLogs.actorId, query.actorId));
  if (query.action) sysConds.push(eq(auditLogs.action, query.action));
  if (query.entityType) sysConds.push(eq(auditLogs.resourceType, query.entityType));
  if (query.fromDate) sysConds.push(gte(auditLogs.createdAt, query.fromDate));
  if (query.toDate) sysConds.push(lte(auditLogs.createdAt, query.toDate));

  const accConds: SQL[] = [];
  if (query.actorId) accConds.push(eq(accountAuditLogs.actorId, query.actorId));
  if (query.action) accConds.push(eq(accountAuditLogs.action, query.action));
  if (query.fromDate) accConds.push(gte(accountAuditLogs.createdAt, query.fromDate));
  if (query.toDate) accConds.push(lte(accountAuditLogs.createdAt, query.toDate));

  const modConds: SQL[] = [];
  if (query.actorId) {
    modConds.push(eq(submissionModerationLogs.moderatorId, query.actorId));
  }
  if (query.action) {
    modConds.push(eq(submissionModerationLogs.action, query.action));
  }
  if (query.fromDate) {
    modConds.push(gte(submissionModerationLogs.createdAt, query.fromDate));
  }
  if (query.toDate) {
    modConds.push(lte(submissionModerationLogs.createdAt, query.toDate));
  }

  const includeAccount = !query.entityType || query.entityType === "User";
  const includeModeration =
    !query.entityType || query.entityType === "Submission";

  const [sysRows, accRows, modRows] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorEmail: users.email,
        actorName: users.fullName,
        action: auditLogs.action,
        entityType: auditLogs.resourceType,
        entityId: auditLogs.resourceId,
        beforeData: auditLogs.oldValue,
        afterData: auditLogs.newValue,
        reason: auditLogs.reason,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(sysConds.length ? and(...sysConds) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(fetchCap),
    includeAccount
      ? db
          .select({
            id: accountAuditLogs.id,
            actorId: accountAuditLogs.actorId,
            actorEmail: users.email,
            actorName: users.fullName,
            action: accountAuditLogs.action,
            entityId: accountAuditLogs.accountId,
            changes: accountAuditLogs.changes,
            reason: accountAuditLogs.reason,
            createdAt: accountAuditLogs.createdAt,
          })
          .from(accountAuditLogs)
          .leftJoin(users, eq(accountAuditLogs.actorId, users.id))
          .where(accConds.length ? and(...accConds) : undefined)
          .orderBy(desc(accountAuditLogs.createdAt))
          .limit(fetchCap)
      : Promise.resolve([]),
    includeModeration
      ? db
          .select({
            id: submissionModerationLogs.id,
            actorId: submissionModerationLogs.moderatorId,
            actorEmail: users.email,
            actorName: users.fullName,
            action: submissionModerationLogs.action,
            entityId: submissionModerationLogs.submissionId,
            reason: submissionModerationLogs.reason,
            createdAt: submissionModerationLogs.createdAt,
          })
          .from(submissionModerationLogs)
          .leftJoin(users, eq(submissionModerationLogs.moderatorId, users.id))
          .where(modConds.length ? and(...modConds) : undefined)
          .orderBy(desc(submissionModerationLogs.createdAt))
          .limit(fetchCap)
      : Promise.resolve([]),
  ]);

  const combined: UnifiedAuditLogItem[] = [
    ...sysRows.map((r) => ({
      id: r.id,
      source: "system" as const,
      actorId: r.actorId,
      actorEmail: r.actorEmail,
      actorName: r.actorName,
      ipAddress: null,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      beforeData: sanitizeAuditData(r.beforeData as Record<string, unknown> | null),
      afterData: sanitizeAuditData(r.afterData as Record<string, unknown> | null),
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    })),
    ...accRows.map((r) => ({
      id: r.id,
      source: "account" as const,
      actorId: r.actorId,
      actorEmail: r.actorEmail,
      actorName: r.actorName,
      ipAddress: null,
      action: r.action,
      entityType: "User",
      entityId: r.entityId,
      beforeData: null,
      afterData: sanitizeAuditData(r.changes),
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    })),
    ...modRows.map((r) => ({
      id: r.id,
      source: "moderation" as const,
      actorId: r.actorId,
      actorEmail: r.actorEmail,
      actorName: r.actorName,
      ipAddress: null,
      action: r.action,
      entityType: "Submission",
      entityId: r.entityId,
      beforeData: null,
      afterData: null,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    })),
  ];

  const searchTerm = query.search?.trim().toLowerCase();
  const filtered = searchTerm
    ? combined.filter((item) =>
        [
          item.action,
          item.entityType,
          item.actorEmail,
          item.actorName,
          item.reason,
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(searchTerm)),
      )
    : combined;

  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const offset = (query.page - 1) * query.limit;
  const items = filtered.slice(offset, offset + query.limit);

  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      total: filtered.length,
      total_pages: Math.max(1, Math.ceil(filtered.length / query.limit)),
    },
  };
}
