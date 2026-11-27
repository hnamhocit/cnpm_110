import type { AuditLogQuery } from "@/types/audit-log";

export const ACTION_LABELS: Record<string, string> = {
  CREATE: "Tạo mới",
  CREATED: "Tạo mới",
  UPDATE: "Cập nhật",
  UPDATED: "Cập nhật",
  DELETE: "Xóa",
  DELETED: "Xóa",
  SOFTDELETE: "Xóa mềm",
  APPROVE: "Phê duyệt",
  APPROVED: "Phê duyệt",
  REJECT: "Từ chối",
  REJECTED: "Từ chối",
  DISQUALIFY: "Loại bài",
  DISQUALIFIED: "Loại bài",
  FINALIZE: "Chốt",
  FINALIZED: "Chốt",
  PUBLISH: "Công bố",
  PUBLISHED: "Công bố",
  ARCHIVE: "Lưu trữ",
  ARCHIVED: "Lưu trữ",
  SUBMIT: "Nộp bài",
  SUBMITTED: "Nộp bài",
  MODERATE: "Kiểm duyệt",
  SCORE: "Chấm điểm",
  LOCK: "Khóa",
  LOCKED: "Khóa",
  UNLOCK: "Mở khóa",
  UNLOCKED: "Mở khóa",
  ASSIGN: "Phân công",
  ASSIGNED: "Phân công",
};

export const RESOURCE_LABELS: Record<string, string> = {
  CONTEST: "Cuộc thi",
  CATEGORY: "Hạng mục",
  CRITERIA: "Tiêu chí",
  JUDGINGROUND: "Vòng chấm",
  SUBMISSION: "Bài dự thi",
  MODERATIONLOG: "Nhật ký kiểm duyệt",
  AIVERIFICATIONLOG: "Nhật ký kiểm tra AI",
  JUDGEEVALUATION: "Đánh giá của giám khảo",
  EVALUATIONSCORE: "Điểm đánh giá",
  CONTESTPUBLICATION: "Công bố cuộc thi",
  EXHIBITIONIMAGE: "Ảnh triển lãm",
  AWARD: "Giải thưởng",
  USER: "Người dùng",
  ROLE: "Vai trò",
  MASTERDATA: "Danh mục dùng chung",
};

function lookupLabel(labels: Record<string, string>, value: string): string {
  const compact = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (labels[compact]) return labels[compact];

  const parts = value
    .trim()
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  for (const part of parts) {
    if (labels[part]) return labels[part];
  }
  return value;
}

export function formatAuditAction(value: string): string {
  return lookupLabel(ACTION_LABELS, value);
}

export function formatAuditResourceType(value: string): string {
  return lookupLabel(RESOURCE_LABELS, value);
}

function trimValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function validateAuditDateRange(
  from: string,
  to: string,
): string | null {
  return from && to && from > to
    ? "Thời gian bắt đầu phải trước thời gian kết thúc."
    : null;
}

export function normalizeAuditQuery(
  input: Partial<AuditLogQuery>,
): AuditLogQuery {
  const rawPage = input.page ?? 1;
  const rawLimit = input.limit ?? 20;
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, Math.floor(rawLimit)))
    : 20;

  const query: AuditLogQuery = { page, limit };
  const actorId = trimValue(input.actorId);
  const action = trimValue(input.action);
  const resourceType = trimValue(input.resourceType);
  const resourceId = trimValue(input.resourceId);
  const search = trimValue(input.search);
  const from = trimValue(input.from);
  const to = trimValue(input.to);

  if (actorId) query.actorId = actorId;
  if (action) query.action = action;
  if (resourceType) query.resourceType = resourceType;
  if (resourceId) query.resourceId = resourceId;
  if (search) query.search = search;

  if (!validateAuditDateRange(from ?? "", to ?? "")) {
    if (from) query.from = from;
    if (to) query.to = to;
  }

  return query;
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.trim() ? value : "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2) || "—";
    } catch {
      return String(value);
    }
  }
  const text = String(value);
  return text.length > 0 ? text : "—";
}

export function formatAuditDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("vi-VN");
}
