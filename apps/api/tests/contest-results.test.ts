import { describe, expect, test, spyOn } from "bun:test";
import { createTestApp } from "./helpers/test-app";
import { pool } from "../src/db";
import contests from "../src/routes/contests.route";

describe("FPC-100: GET /api/v1/contests/:id/results (Winners Showcase)", () => {
  const app = createTestApp();
  app.route("/api/v1/contests", contests);

  test("Returns 404 when contest does not exist or is deleted", async () => {
    const querySpy = spyOn(pool, "query").mockImplementation(async (sql: any) => {
      if (sql.text.includes('from "contests"')) {
        return { rowCount: 0, rows: [] } as any;
      }
      return { rowCount: 0, rows: [] } as any;
    });

    try {
      const res = await app.request("/api/v1/contests/550e8400-e29b-41d4-a716-446655440000/results");
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe(404);
      expect(json.message).toBe("Contest not found");
    } finally {
      querySpy.mockRestore();
    }
  });

  test("Returns 400 when contest is in draft status (not published yet)", async () => {
    const querySpy = spyOn(pool, "query").mockImplementation(async (sql: any) => {
      if (sql.text.includes('from "contests"')) {
        return {
          rowCount: 1,
          rows: [
            [
              "550e8400-e29b-41d4-a716-446655440000",
              "Cuộc thi Ảnh Phim 2026",
              "draft",
            ],
          ],
        } as any;
      }
      return { rowCount: 0, rows: [] } as any;
    });

    try {
      const res = await app.request("/api/v1/contests/550e8400-e29b-41d4-a716-446655440000/results");
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe(400);
      expect(json.message).toContain("published yet");
    } finally {
      querySpy.mockRestore();
    }
  });

  test("Returns 200 with locked results and podium winners when contest is published (BR-16)", async () => {
    const querySpy = spyOn(pool, "query").mockImplementation(async (sql: any) => {
      if (sql.text.includes('from "contests"')) {
        return {
          rowCount: 1,
          rows: [
            [
              "550e8400-e29b-41d4-a716-446655440000",
              "Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026",
              "published",
            ],
          ],
        } as any;
      }
      if (sql.text.includes('from "submissions"')) {
        return {
          rowCount: 3,
          rows: [
            [
              "sub-1",
              "Sapa Mùa Lúa Chín",
              "https://example.com/sapa.jpg",
              "proofs/sapa_negative.jpg",
              "APPROVED",
              "Hoàng Sỹ Sáng",
              "Kodak",
              "Kodak Portra 400",
              "135",
              "Leica M6",
              "Summicron 35mm f/2",
              "LLab Saigon",
            ],
            [
              "sub-2",
              "Phố Cổ Ban Chiều",
              "https://example.com/hanoi.jpg",
              "proofs/hanoi_negative.jpg",
              "APPROVED",
              "Lê Minh Tuấn",
              "Fujifilm",
              "Fujifilm Pro 400H",
              "135",
              "Contax T2",
              "Zeiss Sonnar 38mm f/2.8",
              "Croplab Hà Nội",
            ],
            [
              "sub-3",
              "Ngư Dân Đầm Chuồn",
              "https://example.com/hue.jpg",
              "proofs/hue_negative.jpg",
              "APPROVED",
              "Trần Bảo Ngọc",
              "Ilford",
              "Ilford HP5 Plus",
              "120_66",
              "Hasselblad 500C/M",
              "Planar 80mm f/2.8",
              "Zone5 Film Lab",
            ],
          ],
        } as any;
      }
      return { rowCount: 0, rows: [] } as any;
    });

    try {
      const res = await app.request("/api/v1/contests/550e8400-e29b-41d4-a716-446655440000/results");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.code).toBe(200);
      expect(json.data.resultsLocked).toBe(true);
      expect(json.data.contestId).toBe("550e8400-e29b-41d4-a716-446655440000");

      const winners = json.data.winners;
      expect(winners.length).toBe(3);

      // Gold Winner
      expect(winners[0].award).toBe("GOLD");
      expect(winners[0].awardRank).toBe(1);
      expect(winners[0].authorName).toBe("Hoàng Sỹ Sáng");
      expect(winners[0].filmStock).toBe("Kodak Portra 400");
      expect(winners[0].camera).toBe("Leica M6");
      expect(winners[0].filmFormat).toBe("135");
      expect(winners[0].developmentLab).toBe("LLab Saigon");
      expect(winners[0].isProofVerified).toBe(true);
      expect(winners[0].isResultsLocked).toBe(true);

      // Silver Winner
      expect(winners[1].award).toBe("SILVER");
      expect(winners[1].awardRank).toBe(2);

      // Bronze Winner
      expect(winners[2].award).toBe("BRONZE");
      expect(winners[2].awardRank).toBe(3);
      expect(winners[2].filmFormat).toBe("120_66");
    } finally {
      querySpy.mockRestore();
    }
  });
});
