
import { describe, expect, test } from "bun:test";
import { aggregateScores } from "../src/services/score-aggregation";

const criteria = [
  { id: "composition", maxScore: 10, weight: 0.4 },
  { id: "lighting", maxScore: 10, weight: 0.3 },
  { id: "story", maxScore: 10, weight: 0.3 },
];

describe("FPC-73 Score aggregation", () => {
  test("Calculates weighted score for each judge", () => {
    const result = aggregateScores({
      criteria,
      judges: [
        {
          judgeId: "judge-1",
          criterionScores: [
            { criterionId: "composition", score: 8 },
            { criterionId: "lighting", score: 9 },
            { criterionId: "story", score: 7 },
          ],
        },
      ],
    });

    expect(result.judgeTotals[0].totalScore).toBe(8);
  });

  test("Calculates average final score from multiple judges", () => {
    const result = aggregateScores({
      criteria,
      judges: [
        {
          judgeId: "judge-1",
          criterionScores: [
            { criterionId: "composition", score: 8 },
            { criterionId: "lighting", score: 9 },
            { criterionId: "story", score: 7 },
          ],
        },
        {
          judgeId: "judge-2",
          criterionScores: [
            { criterionId: "composition", score: 9 },
            { criterionId: "lighting", score: 8 },
            { criterionId: "story", score: 8 },
          ],
        },
      ],
    });

    expect(result.finalScore).toBe(8.2);
  });

  test("Rounds final score to two decimal places", () => {
    const result = aggregateScores({
      criteria,
      judges: [
        {
          judgeId: "judge-1",
          criterionScores: [
            { criterionId: "composition", score: 8 },
            { criterionId: "lighting", score: 8 },
            { criterionId: "story", score: 8 },
          ],
        },
        {
          judgeId: "judge-2",
          criterionScores: [
            { criterionId: "composition", score: 9 },
            { criterionId: "lighting", score: 9 },
            { criterionId: "story", score: 9 },
          ],
        },
        {
          judgeId: "judge-3",
          criterionScores: [
            { criterionId: "composition", score: 8 },
            { criterionId: "lighting", score: 8 },
            { criterionId: "story", score: 9 },
          ],
        },
      ],
    });

    expect(result.finalScore).toBe(8.43);
  });

  test("Marks DISCREPANCY_CONFLICT when score difference exceeds 30%", () => {
    const result = aggregateScores({
      criteria,
      judges: [
        {
          judgeId: "judge-1",
          criterionScores: [
            { criterionId: "composition", score: 10 },
            { criterionId: "lighting", score: 10 },
            { criterionId: "story", score: 10 },
          ],
        },
        {
          judgeId: "judge-2",
          criterionScores: [
            { criterionId: "composition", score: 5 },
            { criterionId: "lighting", score: 5 },
            { criterionId: "story", score: 5 },
          ],
        },
      ],
    });

    expect(result.discrepancy).toBe(5);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.flag).toBe("DISCREPANCY_CONFLICT");
  });

  test("Does not mark conflict when difference is exactly 30%", () => {
    const result = aggregateScores({
      criteria,
      judges: [
        {
          judgeId: "judge-1",
          criterionScores: [
            { criterionId: "composition", score: 10 },
            { criterionId: "lighting", score: 10 },
            { criterionId: "story", score: 10 },
          ],
        },
        {
          judgeId: "judge-2",
          criterionScores: [
            { criterionId: "composition", score: 7 },
            { criterionId: "lighting", score: 7 },
            { criterionId: "story", score: 7 },
          ],
        },
      ],
    });

    expect(result.discrepancy).toBe(3);
    expect(result.hasDiscrepancy).toBe(false);
    expect(result.flag).toBeNull();
  });

  test("Rejects criteria weights that do not total 1", () => {
    expect(() =>
      aggregateScores({
        criteria: [
          { id: "composition", maxScore: 10, weight: 0.5 },
          { id: "lighting", maxScore: 10, weight: 0.3 },
        ],
        judges: [
          {
            judgeId: "judge-1",
            criterionScores: [
              { criterionId: "composition", score: 8 },
              { criterionId: "lighting", score: 8 },
            ],
          },
        ],
      }),
    ).toThrow(RangeError);
  });

  test("Rejects scores greater than maximum score", () => {
    expect(() =>
      aggregateScores({
        criteria,
        judges: [
          {
            judgeId: "judge-1",
            criterionScores: [
              { criterionId: "composition", score: 11 },
              { criterionId: "lighting", score: 8 },
              { criterionId: "story", score: 8 },
            ],
          },
        ],
      }),
    ).toThrow(RangeError);
  });

  test("Rejects missing criterion scores", () => {
    expect(() =>
      aggregateScores({
        criteria,
        judges: [
          {
            judgeId: "judge-1",
            criterionScores: [
              { criterionId: "composition", score: 8 },
              { criterionId: "lighting", score: 8 },
            ],
          },
        ],
      }),
    ).toThrow("Each judge must score every criterion");
  });

  test("Rejects empty judge list", () => {
    expect(() =>
      aggregateScores({
        criteria,
        judges: [],
      }),
    ).toThrow("At least one judge is required");
  });
});
