import { describe, expect, test } from "bun:test";

import {
  calculateProgressPercent,
  filterJudgeSubmissions,
  filterJudges,
  getContestJudges,
  getJudgeStats,
  getJudgingState,
  summarizeJudgeProgress,
} from "@/lib/judging-progress";
import type { JudgeProgress } from "@/types/judging";

const judges: JudgeProgress[] = [
  {
    contestId: "contest-a",
    judgeId: "judge-1",
    fullName: "Nguyễn Văn Nghệ",
    email: "nghe.nguyen@analoglab.vn",
    role: "Trưởng ban giám khảo",
    categories: ["Ảnh Đen Trắng", "Ảnh Đường Phố"],
    submissions: [
      {
        submissionId: "sub-001",
        submissionCode: "SUB-2026-0012",
        title: "Sương sớm trên phố cổ",
        categoryName: "Ảnh Đường Phố",
        status: "SCORED",
        scoredAt: "2026-11-16T09:12:00Z",
      },
      {
        submissionId: "sub-002",
        submissionCode: "SUB-2026-0015",
        title: "Bóng đổ bên hiên nhà",
        categoryName: "Ảnh Đen Trắng",
        status: "NOT_SCORED",
        scoredAt: null,
      },
    ],
  },
  {
    contestId: "contest-a",
    judgeId: "judge-2",
    fullName: "Trần Minh Quân",
    email: "quan.tran@vietnamfilm.org",
    role: "Giám khảo chuyên môn",
    categories: ["Chân Dung Phim Màu"],
    submissions: [
      {
        submissionId: "sub-003",
        submissionCode: "SUB-2026-0018",
        title: "Mây phủ đỉnh Tà Xùa",
        categoryName: "Chân Dung Phim Màu",
        status: "SCORED",
        scoredAt: "2026-11-15T10:30:00Z",
      },
    ],
  },
  {
    contestId: "contest-b",
    judgeId: "judge-3",
    fullName: "Đặng Quang Huy",
    email: "huy.dang@visualarts.edu.vn",
    role: "Giám khảo chuyên môn",
    categories: ["Ảnh Đen Trắng"],
    submissions: [
      {
        submissionId: "sub-004",
        submissionCode: "SUB-2026-0023",
        title: "Cầu treo bên sông",
        categoryName: "Ảnh Đen Trắng",
        status: "NOT_SCORED",
        scoredAt: null,
      },
    ],
  },
];

describe("FPC-56 calculateProgressPercent", () => {
  test("làm tròn phần trăm đã chấm", () => {
    expect(calculateProgressPercent(2, 3)).toBe(67);
    expect(calculateProgressPercent(5, 5)).toBe(100);
  });

  test("trả về 0 khi chưa được phân công bài nào", () => {
    expect(calculateProgressPercent(0, 0)).toBe(0);
  });
});

describe("FPC-56 getJudgeStats", () => {
  test("đếm số bài đã chấm và chưa chấm", () => {
    const stats = getJudgeStats(judges[0] as JudgeProgress);

    expect(stats).toEqual({
      assignedCount: 2,
      scoredCount: 1,
      notScoredCount: 1,
      progressPercent: 50,
    });
  });
});

describe("FPC-56 summarizeJudgeProgress", () => {
  test("tổng hợp tiến độ của toàn bộ giám khảo", () => {
    const summary = summarizeJudgeProgress(judges);

    expect(summary.assignedCount).toBe(4);
    expect(summary.scoredCount).toBe(2);
    expect(summary.notScoredCount).toBe(2);
    expect(summary.progressPercent).toBe(50);
  });

  test("trả về 0% khi danh sách rỗng", () => {
    expect(summarizeJudgeProgress([])).toEqual({
      assignedCount: 0,
      scoredCount: 0,
      notScoredCount: 0,
      progressPercent: 0,
    });
  });
});

describe("FPC-56 getJudgingState", () => {
  test("phân loại hoàn thành, đang chấm và chưa bắt đầu", () => {
    expect(
      getJudgingState({
        assignedCount: 3,
        scoredCount: 3,
        notScoredCount: 0,
        progressPercent: 100,
      }),
    ).toBe("COMPLETED");

    expect(
      getJudgingState({
        assignedCount: 3,
        scoredCount: 1,
        notScoredCount: 2,
        progressPercent: 33,
      }),
    ).toBe("IN_PROGRESS");

    expect(
      getJudgingState({
        assignedCount: 2,
        scoredCount: 0,
        notScoredCount: 2,
        progressPercent: 0,
      }),
    ).toBe("NOT_STARTED");
  });

  test("không có bài được phân công cũng là chưa bắt đầu", () => {
    expect(
      getJudgingState({
        assignedCount: 0,
        scoredCount: 0,
        notScoredCount: 0,
        progressPercent: 0,
      }),
    ).toBe("NOT_STARTED");
  });
});

describe("FPC-76 lọc giám khảo theo cuộc thi", () => {
  test("chỉ trả giám khảo thuộc cuộc thi đang chọn", () => {
    expect(getContestJudges(judges, "contest-a").map((j) => j.judgeId)).toEqual(
      ["judge-1", "judge-2"],
    );
    expect(getContestJudges(judges, "contest-b").map((j) => j.judgeId)).toEqual(
      ["judge-3"],
    );
  });

  test("không truyền contestId thì giữ nguyên danh sách", () => {
    expect(getContestJudges(judges, "")).toHaveLength(3);
  });

  test("filterJudges áp dụng thêm bộ lọc cuộc thi", () => {
    expect(
      filterJudges(judges, { contestId: "contest-a" }).map((j) => j.judgeId),
    ).toEqual(["judge-1", "judge-2"]);
  });
});

describe("FPC-56 filterJudges", () => {
  test("lọc theo tên giám khảo, không phân biệt hoa thường", () => {
    const results = filterJudges(judges, { query: "trần minh" });

    expect(results).toHaveLength(1);
    expect(results[0]?.judgeId).toBe("judge-2");
  });

  test("lọc theo hạng mục phụ trách", () => {
    const results = filterJudges(judges, { category: "Ảnh Đen Trắng" });

    expect(results.map((judge) => judge.judgeId)).toEqual([
      "judge-1",
      "judge-3",
    ]);
  });

  test("lọc theo trạng thái tiến độ", () => {
    expect(filterJudges(judges, { state: "COMPLETED" })).toHaveLength(1);
    expect(filterJudges(judges, { state: "NOT_STARTED" })).toHaveLength(1);
    expect(filterJudges(judges, { state: "IN_PROGRESS" })).toHaveLength(1);
  });

  test("trả về toàn bộ khi không truyền bộ lọc", () => {
    expect(filterJudges(judges)).toHaveLength(3);
  });
});

describe("FPC-56 filterJudgeSubmissions", () => {
  const submissions = (judges[0] as JudgeProgress).submissions;

  test("lọc bài đã chấm", () => {
    const results = filterJudgeSubmissions(submissions, { status: "SCORED" });

    expect(results).toHaveLength(1);
    expect(results[0]?.submissionId).toBe("sub-001");
  });

  test("lọc bài chưa chấm", () => {
    const results = filterJudgeSubmissions(submissions, {
      status: "NOT_SCORED",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.submissionId).toBe("sub-002");
  });

  test("tìm theo mã bài hoặc tiêu đề", () => {
    expect(
      filterJudgeSubmissions(submissions, { query: "sub-2026-0015" }),
    ).toHaveLength(1);
    expect(
      filterJudgeSubmissions(submissions, { query: "sương sớm" }),
    ).toHaveLength(1);
    expect(
      filterJudgeSubmissions(submissions, { query: "không tồn tại" }),
    ).toHaveLength(0);
  });
});
