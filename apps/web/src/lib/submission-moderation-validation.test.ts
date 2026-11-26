import { describe, expect, test } from "bun:test";

import {
  formatDeadlineForMessage,
  getSubmissionCode,
  isApprovedStatus,
  isProofSubmitted,
  needsProofRequest,
  normalizeReason,
  toProofDeadlineIso,
  validateReason,
} from "@/lib/submission-moderation-validation";
import type { SubmissionStatus } from "@/types/submission";

describe("submission moderation validation · reason", () => {
  test("từ chối lý do dưới 10 ký tự", () => {
    expect(validateReason("  quá ngắn  ")).not.toBeNull();
  });

  test("chấp nhận đúng 10 ký tự sau trim", () => {
    expect(normalizeReason("  1234567890  ")).toBe("1234567890");
    expect(validateReason("  1234567890  ")).toBeNull();
  });

  test("từ chối lý do quá 1000 ký tự", () => {
    expect(validateReason("x".repeat(1001))).not.toBeNull();
  });
});

describe("submission moderation validation · deadline", () => {
  const now = new Date("2030-01-01T00:00:00Z");

  test("từ chối deadline trống", () => {
    expect(toProofDeadlineIso("  ", now).error).toBeDefined();
  });

  test("từ chối deadline không hợp lệ", () => {
    expect(toProofDeadlineIso("không-phải-ngày", now).error).toBeDefined();
  });

  test("từ chối deadline trong quá khứ", () => {
    expect(toProofDeadlineIso("2029-12-31T23:00", now).error).toBeDefined();
  });

  test("trả ISO cho deadline tương lai, không giới hạn 48h", () => {
    const value = "2030-01-10T09:30";
    expect(toProofDeadlineIso(value, now).iso).toBe(
      new Date(value).toISOString(),
    );
  });

  test("giữ nguyên chuỗi không hợp lệ khi định dạng thông điệp", () => {
    expect(formatDeadlineForMessage("không hợp lệ")).toBe("không hợp lệ");
  });
});

describe("submission moderation validation · trạng thái", () => {
  test("isProofSubmitted nhận diện proofSubmittedAt", () => {
    expect(
      isProofSubmitted({
        status: "PENDING_AI",
        proofSubmittedAt: "2026-01-01T00:00:00Z",
      }),
    ).toBe(true);
    expect(isProofSubmitted({ status: "PROOF_SUBMITTED" })).toBe(true);
    expect(isProofSubmitted({ status: "PENDING_AI" })).toBe(false);
  });

  test("isApprovedStatus chấp nhận cả hai trạng thái duyệt", () => {
    expect(isApprovedStatus("APPROVED")).toBe(true);
    expect(isApprovedStatus("APPROVED_FOR_JUDGING")).toBe(true);
    expect(isApprovedStatus("PROOF_REQUESTED")).toBe(false);
  });

  test("needsProofRequest nhận diện cờ AI và trạng thái đối chứng", () => {
    const base = {
      status: "PENDING_AI" as SubmissionStatus,
      isAiFlagged: false,
    };
    expect(needsProofRequest(base)).toBe(false);
    expect(needsProofRequest({ ...base, isAiFlagged: true })).toBe(true);
    expect(needsProofRequest({ ...base, status: "SUSPICIOUS" })).toBe(true);
    expect(needsProofRequest({ ...base, status: "FLAGGED" })).toBe(true);
    expect(needsProofRequest({ ...base, status: "PROOF_REQUESTED" })).toBe(
      true,
    );
  });

  test("getSubmissionCode ưu tiên code rồi submissionCode rồi id", () => {
    expect(
      getSubmissionCode({ id: "uuid", code: "SUB-1", submissionCode: "SUB-2" }),
    ).toBe("SUB-1");
    expect(getSubmissionCode({ id: "uuid", submissionCode: "SUB-2" })).toBe(
      "SUB-2",
    );
    expect(getSubmissionCode({ id: "uuid" })).toBe("uuid");
  });
});
