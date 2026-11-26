import { beforeEach, describe, expect, it, mock } from "bun:test";

let selectCallIndex = 0;
let mockResults: unknown[][] = [];

function makeChain(result: unknown[]) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "leftJoin", "innerJoin", "groupBy", "orderBy"];
  for (const m of methods) {
    chain[m] = () => chain;
  }
  chain.then = (resolve: (val: unknown) => void) => resolve(result);
  return chain;
}

mock.module("../src/db", () => ({
  db: {
    select: () => {
      const idx = selectCallIndex++;
      return makeChain(mockResults[idx] ?? []);
    },
  },
}));

const { getContestAnalytics } = await import("../src/services/contest-analytics");

describe("getContestAnalytics (UC-28)", () => {
  beforeEach(() => {
    selectCallIndex = 0;
    mockResults = [];
  });

  it("returns contest totals, categories, filmStocks, isoDistribution, labs, and cameras", async () => {
    mockResults = [
      [{ id: "contest-1", name: "Analog 2026" }],
      [
        {
          categoryId: "cat-1",
          categoryName: "Street",
          status: "VERIFIED",
          total: 3,
          flagged: 1,
        },
      ],
      [{ name: "Kodak Portra 400", count: 2 }, { name: "Ilford HP5", count: 1 }],
      [{ iso: 400, count: 3 }],
      [{ name: "Lab Saigon", count: 2 }],
      [{ name: "Leica M6", count: 2 }, { name: "Nikon FM2", count: 1 }],
    ];

    const result = await getContestAnalytics("contest-1", "org-1");

    expect(result.contest).toEqual({ id: "contest-1", name: "Analog 2026" });
    expect(result.totals).toEqual({
      submissions: 3,
      aiWarnings: 1,
      byStatus: { VERIFIED: 3 },
    });
    expect(result.categories).toEqual([
      {
        name: "Street",
        submissions: 3,
        aiWarnings: 1,
        byStatus: { VERIFIED: 3 },
      },
    ]);
    expect(result.filmStocks).toEqual([
      { name: "Kodak Portra 400", count: 2 },
      { name: "Ilford HP5", count: 1 },
    ]);
    expect(result.isoDistribution).toEqual([{ iso: 400, count: 3 }]);
    expect(result.labs).toEqual([{ name: "Lab Saigon", count: 2 }]);
    expect(result.cameras).toEqual([
      { name: "Leica M6", count: 2 },
      { name: "Nikon FM2", count: 1 },
    ]);
  });

  it("throws 404 when contest is not found", async () => {
    mockResults = [[]];
    await expect(getContestAnalytics("missing", "org-1")).rejects.toThrow("Contest not found");
  });
});
