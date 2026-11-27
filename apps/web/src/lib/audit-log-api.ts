import axios from "axios";

import { http } from "@/lib/http/client";
import type {
  AuditLogEntry,
  AuditLogPage,
  AuditLogQuery,
} from "@/types/audit-log";

export const AUDIT_LOGS_ENDPOINT = "/api/v1/audit-logs";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function unwrapPage(body: unknown, query: AuditLogQuery): AuditLogPage {
  if (Array.isArray(body)) {
    const items = body as AuditLogEntry[];
    return {
      items,
      page: query.page,
      limit: query.limit,
      total: items.length,
      totalPages: 1,
    };
  }

  const data = asRecord(body) ?? {};
  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.auditLogs)
      ? data.auditLogs
      : [];
  const items = rawItems as AuditLogEntry[];
  const pagination = asRecord(data.pagination) ?? {};
  const total =
    firstNumber(pagination.total, data.total, pagination.count) ?? items.length;
  const limit = firstNumber(pagination.limit, data.limit) ?? query.limit;
  const page = firstNumber(pagination.page, data.page) ?? query.page;
  const totalPages =
    firstNumber(
      pagination.totalPages,
      pagination.total_pages,
      data.totalPages,
    ) ?? Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return { items, page, limit, total, totalPages };
}

export async function getAuditLogs(
  query: AuditLogQuery,
  signal?: AbortSignal,
): Promise<AuditLogPage> {
  const response = await http.get(AUDIT_LOGS_ENDPOINT, {
    params: {
      actorId: query.actorId,
      action: query.action,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      search: query.search,
      from: query.from,
      to: query.to,
      page: query.page,
      limit: query.limit,
    },
    signal,
  });
  const data = response.data?.data ?? response.data;
  return unwrapPage(data, query);
}

export function getAuditLogErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Không thể tải nhật ký kiểm toán. Vui lòng thử lại.";
  }

  const status = error.response?.status;
  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này. / Access denied.";
  }
  if (status === 404) {
    return "Chưa thể tải nhật ký kiểm toán.";
  }
  if (status !== undefined && status >= 500) {
    return "Hệ thống nhật ký kiểm toán đang gặp sự cố.";
  }

  const body = asRecord(error.response?.data);
  const errorBody = asRecord(body?.error);
  const apiMessage =
    (typeof errorBody?.message === "string" && errorBody.message) ||
    (typeof body?.message === "string" && body.message) ||
    "";
  return apiMessage || "Không thể tải nhật ký kiểm toán. Vui lòng thử lại.";
}
