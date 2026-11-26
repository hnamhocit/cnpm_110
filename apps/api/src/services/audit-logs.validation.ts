import { UUID_PATTERN } from "../middlewares/auth";
import { AppError } from "../utils/errors";

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|api[-_]?key|authorization|credential/i;

export function sanitizeAuditData(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const sanitized: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      sanitized[key] = sanitizeAuditData(entry as Record<string, unknown>);
    } else {
      sanitized[key] = entry;
    }
  }
  return sanitized;
}

export interface AuditLogQuery {
  action?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function validateAuditLogQuery(raw: AuditLogQuery) {
  if (raw.actorId && !UUID_PATTERN.test(raw.actorId)) {
    throw AppError.badRequest("MSG002: actorId must be a valid UUID");
  }
  const fromDate = raw.from ? new Date(raw.from) : undefined;
  if (fromDate && Number.isNaN(fromDate.getTime())) {
    throw AppError.badRequest("MSG002: from must be a valid ISO timestamp");
  }
  const toDate = raw.to ? new Date(raw.to) : undefined;
  if (toDate && Number.isNaN(toDate.getTime())) {
    throw AppError.badRequest("MSG002: to must be a valid ISO timestamp");
  }
  if (fromDate && toDate && fromDate > toDate) {
    throw AppError.badRequest("MSG002: from must be earlier than or equal to to");
  }
  const page = raw.page && raw.page > 0 ? raw.page : 1;
  const limit = raw.limit && raw.limit > 0 ? Math.min(raw.limit, 100) : 25;
  return { ...raw, fromDate, toDate, page, limit };
}
