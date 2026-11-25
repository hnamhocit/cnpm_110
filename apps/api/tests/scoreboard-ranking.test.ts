import { describe, expect, test } from "bun:test";
import { assignCompetitionRanks } from "../src/services/scoreboard-ranking";

describe("FPC-75: Competition ranking", () => {
  test("Assigns the same rank to entries with equal scores", () => {
    const result = assignCompetitionRanks([
      { id: "A", categoryId: "cat-1", finalScore: 9.5 },
      { id: "B", categoryId: "cat-1", finalScore: 9.5 },
      { id: "C", categoryId: "cat-1", finalScore: 9.2 },
      { id: "D", categoryId: "cat-1", finalScore: 9.0 },
    ]);

    expect(result.map((entry) => entry.rank)).toEqual([
      1, 1, 3, 4,
    ]);
  });

  test("Keeps incomplete entries without a rank", () => {
    const result = assignCompetitionRanks([
      { id: "A", categoryId: "cat-1", finalScore: 9.5 },
      { id: "B", categoryId: "cat-1", finalScore: null },
      { id: "C", categoryId: "cat-1", finalScore: 9.2 },
    ]);

    expect(result.map((entry) => entry.rank)).toEqual([
      1, null, 2,
    ]);
  });

  test("Ranks each category independently", () => {
    const result = assignCompetitionRanks([
      { id: "A", categoryId: "cat-1", finalScore: 9.5 },
      { id: "B", categoryId: "cat-1", finalScore: 9.5 },
      { id: "C", categoryId: "cat-2", finalScore: 8.0 },
      { id: "D", categoryId: "cat-2", finalScore: 7.0 },
    ]);

    expect(result.map((entry) => entry.rank)).toEqual([
      1, 1, 1, 2,
    ]);
  });

  test("Does not mutate the original entries", () => {
    const entries = [
      { id: "A", categoryId: "cat-1", finalScore: 9.5 },
      { id: "B", categoryId: "cat-1", finalScore: 9.5 },
    ];

    const original = structuredClone(entries);

    assignCompetitionRanks(entries);

    expect(entries).toEqual(original);
  });

  test("Returns an empty array for empty input", () => {
    expect(assignCompetitionRanks([])).toEqual([]);
  });
});
