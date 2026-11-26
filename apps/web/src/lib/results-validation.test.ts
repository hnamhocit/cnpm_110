import { describe, expect, test } from "bun:test";

import {
  buildPublishPayload,
  detectTieGroups,
  formatOfficialScore,
  round2Score,
  validateTieBreakDecisions,
} from "@/lib/results-validation";

const tiedEntries = [
  { submissionId: "a", categoryId: "cat-a", finalScore: 8.5, rank: 2 },
  { submissionId: "b", categoryId: "cat-a", finalScore: 8.5, rank: 1 },
  { submissionId: "c", categoryId: "cat-b", finalScore: 8.5, rank: 1 },
];

describe("FPC-110 điểm chính thức (BR-25)", () => {
  test("làm tròn 2 chữ số và hiển thị — khi null", () => {
    expect(round2Score(8.504)).toBe(8.5);
    expect(formatOfficialScore(8.504)).toBe("8.50");
    expect(formatOfficialScore(null)).toBe("—");
    expect(formatOfficialScore(undefined)).toBe("—");
  });
});

describe("FPC-110 detectTieGroups", () => {
  test("chỉ gộp đồng điểm cùng hạng mục, sắp theo hạng rồi ID", () => {
    expect(detectTieGroups(tiedEntries)).toEqual([
      {
        key: "cat-a|8.50",
        categoryId: "cat-a",
        submissionIds: ["b", "a"],
        score: 8.5,
      },
    ]);
  });

  test("8.504 được tính là 8.50 khi xác định nhóm đồng điểm", () => {
    const groups = detectTieGroups([
      { submissionId: "a", categoryId: "cat-a", finalScore: 8.5, rank: 1 },
      { submissionId: "d", categoryId: "cat-a", finalScore: 8.504, rank: 2 },
      { submissionId: "e", categoryId: "cat-b", finalScore: 8.5, rank: 1 },
    ]);
    expect(groups).toEqual([
      {
        key: "cat-a|8.50",
        categoryId: "cat-a",
        submissionIds: ["a", "d"],
        score: 8.5,
      },
    ]);
  });
});

describe("FPC-110 validateTieBreakDecisions", () => {
  const groups = detectTieGroups(tiedEntries);
  const key = "cat-a|8.50";

  test("từ chối lý do rỗng hoặc quá 1000 ký tự", () => {
    expect(
      validateTieBreakDecisions(groups, {
        [key]: { submissionIds: ["a", "b"], reason: "   " },
      })[key],
    ).toContain("lý do");
    expect(
      validateTieBreakDecisions(groups, {
        [key]: { submissionIds: ["a", "b"], reason: "x".repeat(1001) },
      })[key],
    ).toContain("1000");
  });

  test("từ chối nhóm sai tập submission ID", () => {
    expect(
      validateTieBreakDecisions(groups, {
        [key]: { submissionIds: ["a", "c"], reason: "Theo thể lệ" },
      })[key],
    ).toContain("không khớp");
  });

  test("chấp nhận đúng tập ID dù thứ tự khác và có lý do", () => {
    expect(
      validateTieBreakDecisions(groups, {
        [key]: { submissionIds: ["b", "a"], reason: "Theo thể lệ" },
      }),
    ).toEqual({});
  });
});

describe("FPC-110 buildPublishPayload", () => {
  test("gửi tieBreaks đã xác nhận, không tự xếp lại hạng", () => {
    expect(
      buildPublishPayload(true, {
        "cat-a|8.50": {
          submissionIds: ["b", "a"],
          reason: "Theo thể lệ",
        },
      }),
    ).toEqual({
      confirm: true,
      tieBreaks: [
        {
          categoryId: "cat-a",
          submissionIds: ["b", "a"],
          reason: "Theo thể lệ",
        },
      ],
    });
  });

  test("bỏ qua quyết định thiếu lý do và không gửi tieBreaks rỗng", () => {
    expect(
      buildPublishPayload(true, {
        "cat-a|8.50": { submissionIds: ["a", "b"], reason: " " },
      }),
    ).toEqual({ confirm: true });
    expect(buildPublishPayload(true, {})).toEqual({ confirm: true });
  });
});
