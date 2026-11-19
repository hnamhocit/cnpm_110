import { describe, expect, test, spyOn } from "bun:test";
import { Hono } from "hono";
import { pool } from "../src/db";
import contests from "../src/routes/contests";

function createTestApp() {
  const app = new Hono();
  app.route("/api/v1/contests", contests);
  return app;
}

describe("FPC-100: GET /api/v1/contests/:id/results (Winners Showcase)", () => {
  const app = createTestApp();

  test("Returns 404 when contest does not exist or is deleted", async () => {
    const querySpy = spyOn(pool, "query").mockImplementation(async (sql: any) => {
      if (typeof sql === "string" && sql.includes("FROM contests")) {
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
      if (typeof sql === "string" && sql.includes("FROM contests")) {
        return {
          rowCount: 1,
          rows: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              name: "Cuộc thi Ảnh Phim 2026",
              status: "draft",
            },
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
      if (typeof sql === "string" && sql.includes("FROM contests")) {
        return {
          rowCount: 1,
          rows: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              name: "Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026",
              status: "published",
            },
          ],
        } as any;
      }
      if (typeof sql === "string" && sql.includes("FROM submissions")) {
        return {
          rowCount: 3,
          rows: [
            {
              submission_id: "sub-1",
              title: "Sapa Mùa Lúa Chín",
              photo_url: "https://example.com/sapa.jpg",
              negative_proof_path: "proofs/sapa_negative.jpg",
              submission_status: "APPROVED",
              created_at: new Date(),
              author_name: "Hoàng Sỹ Sáng",
              film_brand: "Kodak",
              film_stock: "Kodak Portra 400",
              film_format: "135",
              camera: "Leica M6",
              lens: "Summicron 35mm f/2",
              dev_lab: "LLab Saigon",
            },
            {
              submission_id: "sub-2",
              title: "Phố Cổ Ban Chiều",
              photo_url: "https://example.com/hanoi.jpg",
              negative_proof_path: "proofs/hanoi_negative.jpg",
              submission_status: "APPROVED",
              created_at: new Date(),
              author_name: "Lê Minh Tuấn",
              film_brand: "Fujifilm",
              film_stock: "Fujifilm Pro 400H",
              film_format: "135",
              camera: "Contax T2",
              lens: "Zeiss Sonnar 38mm f/2.8",
              dev_lab: "Croplab Hà Nội",
            },
            {
              submission_id: "sub-3",
              title: "Ngư Dân Đầm Chuồn",
              photo_url: "https://example.com/hue.jpg",
              negative_proof_path: "proofs/hue_negative.jpg",
              submission_status: "APPROVED",
              created_at: new Date(),
              author_name: "Trần Bảo Ngọc",
              film_brand: "Ilford",
              film_stock: "Ilford HP5 Plus",
              film_format: "120_66",
              camera: "Hasselblad 500C/M",
              lens: "Planar 80mm f/2.8",
              dev_lab: "Zone5 Film Lab",
            },
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
