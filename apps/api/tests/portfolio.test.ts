import { describe, expect, test } from "bun:test";
import { sign } from "hono/jwt";
import { createTestApp } from "./helpers/test-app";
import auth from "../src/routes/auth.route";

const TEST_SECRET = "portfolio-test-secret-at-least-32-chars";

async function createToken(role = "Participant") {
  return sign(
    {
      id: "a95fec4f-30e7-4e80-9fd2-3a8631d59c86",
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    Bun.env.JWT_SECRET || TEST_SECRET,
    "HS256",
  );
}

describe("FPC-101: GET /api/v1/auth/portfolio (Personal Portfolio & Awards)", () => {
  const app = createTestApp();
  app.route("/api/v1/auth", auth);
  Bun.env.JWT_SECRET = TEST_SECRET;

  test("Requires authentication (401 when missing token)", async () => {
    const res = await app.request("/api/v1/auth/portfolio");
    expect(res.status).toBe(401);
  });

  test("Returns 200 with user profile, stats, awards history and curated works", async () => {
    const token = await createToken();

    const res = await app.request("/api/v1/auth/portfolio", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.code).toBe(200);
    expect(json.data.user.fullName).toBe("Test Participant");
    expect(json.data.stats.totalSubmissions).toBeGreaterThanOrEqual(1);
    expect(json.data.stats.awardsCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(json.data.curatedWorks)).toBe(true);
  });
});
