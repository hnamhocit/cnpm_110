import { describe, expect, test, spyOn } from "bun:test";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { pool } from "../src/db";
import auth from "../src/routes/auth.route";

const TEST_SECRET = "portfolio-test-secret-at-least-32-chars";

async function createToken(role = "Participant") {
  return sign(
    {
      id: "user-portfolio-123",
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    TEST_SECRET,
    "HS256",
  );
}

function createTestApp() {
  const app = new Hono();
  app.route("/api/v1/auth", auth);
  return app;
}

describe("FPC-101: GET /api/v1/auth/portfolio (Personal Portfolio & Awards)", () => {
  const app = createTestApp();
  Bun.env.JWT_SECRET = TEST_SECRET;

  test("Requires authentication (401 when missing token)", async () => {
    const res = await app.request("/api/v1/auth/portfolio");
    expect(res.status).toBe(401);
  });

  test("Returns 200 with user profile, stats, awards history and curated works", async () => {
    const token = await createToken();

    const querySpy = spyOn(pool, "query").mockImplementation(async (sql: any) => {
      if (typeof sql === "string" && sql.includes("FROM users")) {
        return {
          rowCount: 1,
          rows: [
            {
              id: "user-portfolio-123",
              full_name: "Lê Hoàng Nam",
              email: "nam.le@filmcontest.vn",
              role: "Participant",
              created_at: new Date("2026-01-01"),
            },
          ],
        } as any;
      }
      if (typeof sql === "string" && sql.includes("COUNT(*)::int AS total_submissions")) {
        return {
          rowCount: 1,
          rows: [
            {
              total_submissions: 5,
              approved_works: 3,
            },
          ],
        } as any;
      }
      if (typeof sql === "string" && sql.includes("LIMIT 12")) {
        return {
          rowCount: 2,
          rows: [
            {
              id: "sub-1",
              title: "Sapa Mùa Lúa Chín",
              photo_url: "https://example.com/sapa.jpg",
              status: "APPROVED",
              contest_name: "Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026",
              film_stock: "Kodak Portra 400",
              camera: "Leica M6",
              lens: "Summicron 35mm f/2",
              film_format: "135",
            },
            {
              id: "sub-2",
              title: "Phố Cổ Mùa Thu",
              photo_url: "https://example.com/hanoi.jpg",
              status: "APPROVED",
              contest_name: "Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026",
              film_stock: "Fujifilm Pro 400H",
              camera: "Contax T2",
              lens: "Sonnar 38mm f/2.8",
              film_format: "135",
            },
          ],
        } as any;
      }
      if (typeof sql === "string" && sql.includes("FROM submissions s") && sql.includes("JOIN contests c")) {
        return {
          rowCount: 1,
          rows: [
            {
              submission_id: "sub-gold-1",
              submission_title: "Sapa Mùa Lúa Chín",
              photo_url: "https://example.com/sapa.jpg",
              awarded_at: new Date("2026-10-15"),
              contest_id: "contest-01",
              contest_name: "Cuộc thi Nhiếp ảnh Phim Mùa Thu 2026",
              contest_status: "PUBLISHED",
              film_brand: "Kodak",
              film_stock: "Kodak Portra 400",
              film_format: "135",
              camera: "Leica M6",
              lens: "Summicron 35mm f/2",
              dev_lab: "LLab Saigon",
            },
          ],
        } as any;
      }
      return { rowCount: 0, rows: [] } as any;
    });

    try {
      const res = await app.request("/api/v1/auth/portfolio", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.code).toBe(200);
      expect(json.data.user.fullName).toBe("Lê Hoàng Nam");
      expect(json.data.stats.totalSubmissions).toBe(5);
      expect(json.data.stats.approvedWorks).toBe(3);
      expect(json.data.stats.awardsCount).toBe(1);

      // Award item
      const award = json.data.awards[0];
      expect(award.award).toBe("GOLD");
      expect(award.awardRank).toBe(1);
      expect(award.submissionTitle).toBe("Sapa Mùa Lúa Chín");
      expect(award.filmStock).toBe("Kodak Portra 400");
      expect(award.camera).toBe("Leica M6");
      expect(award.developmentLab).toBe("LLab Saigon");

      // Curated works
      expect(json.data.curatedWorks.length).toBe(2);
      expect(json.data.curatedWorks[0].title).toBe("Sapa Mùa Lúa Chín");
    } finally {
      querySpy.mockRestore();
    }
  });
});
