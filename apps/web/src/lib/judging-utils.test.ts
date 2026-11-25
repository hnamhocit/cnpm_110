import { describe, expect, it } from "bun:test";
import {
  calculateWeightedTotalScore,
  validateScorecardCompletion,
} from "./judging-utils";
import type { ScoringCriterion } from "@/types/judging";

const sampleCriteria: ScoringCriterion[] = [
  {
    id: "crit-1",
    name: "Ý tưởng nghệ thuật",
    description: "Tính độc đáo và thông điệp",
    maxScore: 10,
    weight: 40,
  },
  {
    id: "crit-2",
    name: "Kỹ thuật phơi sáng & Bố cục",
    description: "Độ chuẩn xác ánh sáng và đường dẫn",
    maxScore: 10,
    weight: 30,
  },
  {
    id: "crit-3",
    name: "Khai thác chất cảm phim Analog",
    description: "Tông màu, độ tương phản và hạt grain",
    maxScore: 10,
    weight: 30,
  },
];

describe("FPC-81 Judging Scoring Utils", () => {
  it("tính điểm tổng hợp có trọng số chính xác", () => {
    const scores = {
      "crit-1": 8, // 8 * 0.4 = 3.2
      "crit-2": 9, // 9 * 0.3 = 2.7
      "crit-3": 7, // 7 * 0.3 = 2.1 => Tổng = 8.0
    };

    const res = calculateWeightedTotalScore(sampleCriteria, scores);
    expect(res.totalScore).toBe(8.0);
    expect(res.maxPossibleScore).toBe(10.0);
    expect(res.percentage).toBe(80.0);
  });

  it("kiểm tra validation khi chưa chấm đủ tiêu chí", () => {
    const scores = {
      "crit-1": 8,
    };
    const res = validateScorecardCompletion(
      sampleCriteria,
      scores,
      "Tác phẩm có ánh sáng rất tốt."
    );
    expect(res.isValid).toBe(false);
    expect(res.missingCriteriaNames).toHaveLength(2);
  });

  it("kiểm tra validation khi nhận xét quá ngắn", () => {
    const scores = {
      "crit-1": 8,
      "crit-2": 8,
      "crit-3": 8,
    };
    const res = validateScorecardCompletion(sampleCriteria, scores, "Đẹp");
    expect(res.isValid).toBe(false);
    expect(res.commentError).toBeDefined();
  });
});

