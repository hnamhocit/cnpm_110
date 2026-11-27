import { describe, expect, test } from "bun:test";
import {
  formatAuditAction,
  formatAuditDate,
  formatAuditResourceType,
  formatAuditValue,
  normalizeAuditQuery,
  validateAuditDateRange,
} from "@/lib/audit-log-utils";

describe("FPC-126 Audit Log Utils", () => {
  test("normalizeAuditQuery trims filters and keeps valid page/limit", () => {
    expect(
      normalizeAuditQuery({
        actorId: "  user-1  ",
        action: "  CREATE ",
        resourceType: " contest ",
        resourceId: " c-1 ",
        search: "  abc  ",
        from: " 2026-11-01 ",
        to: " 2026-11-27 ",
        page: 3,
        limit: 20,
      }),
    ).toEqual({
      actorId: "user-1",
      action: "CREATE",
      resourceType: "contest",
      resourceId: "c-1",
      search: "abc",
      from: "2026-11-01",
      to: "2026-11-27",
      page: 3,
      limit: 20,
    });
  });

  test("normalizeAuditQuery clamps page and limit", () => {
    expect(normalizeAuditQuery({ page: 0, limit: 500 })).toEqual({
      page: 1,
      limit: 100,
    });
    expect(normalizeAuditQuery({ page: -5, limit: 0 })).toEqual({
      page: 1,
      limit: 1,
    });
    expect(
      normalizeAuditQuery({ page: Number.NaN, limit: Number.NaN }),
    ).toEqual({ page: 1, limit: 20 });
  });

  test("normalizeAuditQuery drops invalid date range and empty strings", () => {
    expect(
      normalizeAuditQuery({
        from: "2026-11-27",
        to: "2026-11-01",
        search: "   ",
        page: 1,
        limit: 10,
      }),
    ).toEqual({ page: 1, limit: 10 });
  });

  test("validateAuditDateRange returns message only when from is after to", () => {
    expect(validateAuditDateRange("2026-11-27", "2026-11-01")).not.toBeNull();
    expect(validateAuditDateRange("2026-11-01", "2026-11-27")).toBeNull();
    expect(validateAuditDateRange("", "2026-11-27")).toBeNull();
  });

  test("formatAuditValue renders JSON, primitives and em dash", () => {
    expect(formatAuditValue({ status: "DRAFT" })).toBe(
      '{\n  "status": "DRAFT"\n}',
    );
    expect(formatAuditValue([1, 2])).toBe("[\n  1,\n  2\n]");
    expect(formatAuditValue(42)).toBe("42");
    expect(formatAuditValue(null)).toBe("—");
    expect(formatAuditValue(undefined)).toBe("—");
    expect(formatAuditValue("   ")).toBe("—");
  });

  test("formatAuditDate formats ISO date and falls back to input", () => {
    const iso = "2026-11-27T00:00:00Z";
    expect(formatAuditDate(iso)).toBe(new Date(iso).toLocaleString("vi-VN"));
    expect(formatAuditDate("not-a-date")).toBe("not-a-date");
  });

  test("label helpers map common values and keep unknown API values", () => {
    expect(formatAuditAction("SUBMISSION_APPROVED")).toBe("Phê duyệt");
    expect(formatAuditResourceType("ai_verification_log")).toBe(
      "Nhật ký kiểm tra AI",
    );
    expect(formatAuditAction("CUSTOM_ACTION")).toBe("CUSTOM_ACTION");
    expect(formatAuditResourceType("UnknownResource")).toBe("UnknownResource");
  });
});
