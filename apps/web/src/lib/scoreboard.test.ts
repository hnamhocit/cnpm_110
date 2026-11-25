import { describe, expect, test } from "bun:test";

import {
  computeFinalScore,
  filterScoreboard,
  formatScore,
  getScoreboardStatus,
  rankScoreboard,
  summarizeScoreboard,
} from "@/lib/scoreboard";
import type { ScoreboardEntry } from "@/types/scoreboard";

function score(judgeId: string, totalScore: number) {
  return {
    judgeId,
    judgeName: `Giám khảo ${judgeId}`,
    totalScore,
    submittedAt: "2026-11-18T10:00:00Z",
  };
}

function entry(
  overrides: Partial<ScoreboardEntry> & { submissionId: string },
): ScoreboardEntry {
  return {
    submissionCode: `SUB-${overrides.submissionId}`,
    title: `Bài thi ${overrides.submissionId}`,
    categoryId: "cat-bw",
    categoryName: "Ảnh Đen Trắng",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [],
    ...overrides,
  };
}

const completeEntry = entry({
  submissionId: "a",
  scores: [score("j1", 28), score("j2", 27.5), score("j3", 28.5)],
});

const wideSpreadEntry = entry({
  submissionId: "b",
  scores: [score("j1", 29), score("j2", 18), score("j3", 28.5)],
});

const judgingEntry = entry({
  submissionId: "c",
  scores: [score("j1", 25)],
});

describe("FPC-77 computeFinalScore", () => {
  test("tính trung bình cộng và làm tròn 2 chữ số (BR-25)", () => {
    expect(computeFinalScore(completeEntry)).toBe(28);
    expect(
      computeFinalScore(
        entry({
          submissionId: "round",
          scores: [score("j1", 29), score("j2", 18), score("j3", 28.5)],
        }),
      ),
    ).toBe(25.17);
  });

  test("chưa đủ phiếu thì chưa có điểm chung cuộc", () => {
    expect(computeFinalScore(judgingEntry)).toBeNull();
  });

  test("không có giám khảo được phân công thì trả null", () => {
    expect(
      computeFinalScore(entry({ submissionId: "d", judgeCount: 0 })),
    ).toBeNull();
  });
});

describe("FPC-77 getScoreboardStatus", () => {
  test("đánh dấu hoàn tất khi đủ phiếu", () => {
    expect(getScoreboardStatus(completeEntry)).toBe("COMPLETE");
    expect(getScoreboardStatus(judgingEntry)).toBe("JUDGING");
    expect(getScoreboardStatus(wideSpreadEntry)).toBe("COMPLETE");
  });
});

describe("FPC-77 rankScoreboard", () => {
  const ranked = rankScoreboard([
    judgingEntry,
    completeEntry,
    wideSpreadEntry,
    entry({
      submissionId: "e",
      categoryId: "cat-street",
      categoryName: "Ảnh Đường Phố",
      scores: [score("j1", 26), score("j2", 25.5), score("j3", 26.5)],
    }),
  ]);

  test("xếp hạng trong từng hạng mục theo điểm trung bình giảm dần", () => {
    const blackAndWhite = ranked.filter((item) => item.categoryId === "cat-bw");

    expect(blackAndWhite[0]?.submissionId).toBe("a");
    expect(blackAndWhite[0]?.rank).toBe(1);
    expect(blackAndWhite[1]?.submissionId).toBe("b");
    expect(blackAndWhite[1]?.rank).toBe(2);
  });

  test("bài đang chấm không có hạng và xếp cuối hạng mục", () => {
    const blackAndWhite = ranked.filter((item) => item.categoryId === "cat-bw");
    const last = blackAndWhite.at(-1);

    expect(last?.submissionId).toBe("c");
    expect(last?.rank).toBeNull();
  });

  test("bài đủ phiếu ở hạng mục khác vẫn bắt đầu từ hạng 1", () => {
    const street = ranked.filter((item) => item.categoryId === "cat-street");

    expect(street).toHaveLength(1);
    expect(street[0]?.rank).toBe(1);
  });
});

describe("FPC-77 summarizeScoreboard", () => {
  test("đếm theo trạng thái và bài thiếu âm bản", () => {
    const summary = summarizeScoreboard([
      completeEntry,
      wideSpreadEntry,
      judgingEntry,
      entry({
        submissionId: "f",
        proofRequired: true,
        negativeProofVerified: false,
        scores: [score("j1", 20), score("j2", 20), score("j3", 20)],
      }),
    ]);

    expect(summary.total).toBe(4);
    expect(summary.completed).toBe(3);
    expect(summary.judging).toBe(1);
    expect(summary.missingProof).toBe(1);
  });
});

describe("FPC-77 filterScoreboard", () => {
  const ranked = rankScoreboard([
    completeEntry,
    wideSpreadEntry,
    judgingEntry,
    entry({
      submissionId: "g",
      categoryId: "cat-street",
      categoryName: "Ảnh Đường Phố",
      title: "Phố đêm",
      scores: [score("j1", 26), score("j2", 26), score("j3", 26)],
    }),
  ]);

  test("lọc theo từ khoá mã bài hoặc tiêu đề", () => {
    expect(filterScoreboard(ranked, { query: "phố đêm" })).toHaveLength(1);
    expect(filterScoreboard(ranked, { query: "SUB-g" })).toHaveLength(1);
  });

  test("lọc theo hạng mục", () => {
    expect(filterScoreboard(ranked, { categoryId: "cat-street" })).toHaveLength(
      1,
    );
  });

  test("lọc theo trạng thái", () => {
    expect(filterScoreboard(ranked, { status: "COMPLETE" })).toHaveLength(3);
    expect(filterScoreboard(ranked, { status: "JUDGING" })).toHaveLength(1);
  });

  test("không truyền bộ lọc thì giữ nguyên", () => {
    expect(filterScoreboard(ranked)).toHaveLength(4);
  });
});

describe("FPC-77 formatScore", () => {
  test("hiển thị 2 chữ số thập phân và dấu gạch khi chưa có điểm", () => {
    expect(formatScore(28)).toBe("28,00");
    expect(formatScore(25.17)).toBe("25,17");
    expect(formatScore(null)).toBe("—");
  });
});
