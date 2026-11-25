import { describe, expect, test } from "bun:test";

import {
  fetchMockScoreboard,
  MOCK_SCOREBOARD_CONTESTS,
} from "@/lib/mock-scoreboard";
import {
  computeFinalScore,
  filterScoreboard,
  formatScore,
  getScoreboardStatus,
  isDiscrepancy,
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
    contestId: "contest-a",
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

const discrepancyEntry = entry({
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

describe("FPC-77 isDiscrepancy (BR-14)", () => {
  test("lệch 11 điểm trên thang 30 bị gắn cờ", () => {
    expect(isDiscrepancy(discrepancyEntry)).toBe(true);
  });

  test("lệch đúng 30% thang điểm thì không gắn cờ", () => {
    expect(
      isDiscrepancy(
        entry({
          submissionId: "edge",
          scores: [score("j1", 29), score("j2", 20), score("j3", 28.5)],
        }),
      ),
    ).toBe(false);
  });

  test("chưa đủ 2 phiếu thì không so sánh", () => {
    expect(isDiscrepancy(judgingEntry)).toBe(false);
  });
});

describe("FPC-77 getScoreboardStatus", () => {
  test("phân loại hoàn tất, đang chấm và lệch điểm", () => {
    expect(getScoreboardStatus(completeEntry)).toBe("COMPLETE");
    expect(getScoreboardStatus(judgingEntry)).toBe("JUDGING");
    expect(getScoreboardStatus(discrepancyEntry)).toBe("DISCREPANCY");
  });

  test("gắn cờ lệch điểm sớm khi mới có 2 phiếu (BR-14)", () => {
    expect(
      getScoreboardStatus(
        entry({
          submissionId: "early",
          scores: [score("j1", 29), score("j2", 18)],
        }),
      ),
    ).toBe("DISCREPANCY");
  });
});

describe("FPC-77 rankScoreboard", () => {
  const ranked = rankScoreboard([
    judgingEntry,
    completeEntry,
    discrepancyEntry,
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
  });

  test("bài còn chênh lệch chưa xử lý không được xếp hạng (BR-14/25)", () => {
    const flagged = ranked.find((item) => item.submissionId === "b");

    expect(flagged?.status).toBe("DISCREPANCY");
    expect(flagged?.finalScore).toBeNull();
    expect(flagged?.rank).toBeNull();
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
      discrepancyEntry,
      judgingEntry,
      entry({
        submissionId: "f",
        negativeProofVerified: false,
        scores: [score("j1", 20), score("j2", 20), score("j3", 20)],
      }),
    ]);

    expect(summary.total).toBe(4);
    expect(summary.completed).toBe(2);
    expect(summary.discrepancy).toBe(1);
    expect(summary.judging).toBe(1);
    expect(summary.missingProof).toBe(1);
  });
});

describe("FPC-77 filterScoreboard", () => {
  const ranked = rankScoreboard([
    completeEntry,
    discrepancyEntry,
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
    expect(filterScoreboard(ranked, { status: "DISCREPANCY" })).toHaveLength(1);
    expect(filterScoreboard(ranked, { status: "JUDGING" })).toHaveLength(1);
  });

  test("không truyền bộ lọc thì giữ nguyên", () => {
    expect(filterScoreboard(ranked)).toHaveLength(4);
  });
});

describe("FPC-77 lọc bảng điểm theo cuộc thi", () => {
  test("chỉ trả bài thi thuộc cuộc thi đang chọn", async () => {
    const contestId = MOCK_SCOREBOARD_CONTESTS[0]?.id ?? "";
    const snapshot = await fetchMockScoreboard(contestId);

    expect(snapshot.entries.length).toBeGreaterThan(0);
    expect(
      snapshot.entries.every((entry) => entry.contestId === contestId),
    ).toBe(true);
  });

  test("không truyền cuộc thi thì trả toàn bộ dữ liệu mẫu", async () => {
    const first = await fetchMockScoreboard("fpc-2026-national");
    const second = await fetchMockScoreboard("fpc-2026-monochrome");
    const all = await fetchMockScoreboard();

    expect(all.entries.length).toBe(
      first.entries.length + second.entries.length,
    );
  });
});

describe("FPC-77 formatScore", () => {
  test("hiển thị 2 chữ số thập phân và dấu gạch khi chưa có điểm", () => {
    expect(formatScore(28)).toBe("28,00");
    expect(formatScore(25.17)).toBe("25,17");
    expect(formatScore(null)).toBe("—");
  });
});
