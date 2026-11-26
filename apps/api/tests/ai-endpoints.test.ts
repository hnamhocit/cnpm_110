import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { sign, verify } from "hono/jwt";

process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";

mock.module("../src/db", () => ({
  pool: {
    query: async () => ({
      rowCount: 1,
      rows: [{ is_active: true, role: "Admin" }],
    }),
  },
  db: {},
}));

mock.module("../src/middlewares/auth", () => ({
  authenticate: async (c: any, next: any) => {
    const auth = c.req.header("Authorization");
    const token = auth?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return c.json({ error: "Missing token" }, 401);
    const payload = await verify(token, TEST_SECRET, "HS256").catch(() => null);
    if (!payload) return c.json({ error: "Invalid token" }, 401);
    c.set("user", { id: payload.id, role: payload.role });
    await next();
  },
  requireRoles: (...roles: string[]) => async (c: any, next: any) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  },
}));

const { default: aiWebhookRoute } = await import("../src/routes/ai-webhook.route");
const { createTestApp } = await import("./helpers/test-app");

const app = createTestApp();
app.route("/api/v1/ai", aiWebhookRoute);

const TEST_SECRET = "test-secret-key-at-least-32-chars-long";
let originalSecret: string | undefined;

async function makeToken(role: "Admin" | "Organizer" | "Judge" | "Participant") {
  return sign(
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    TEST_SECRET,
    "HS256",
  );
}

describe("FPC-102: AI Thresholds (UC-09) & AI Scan Triggers (UC-19)", () => {
  beforeEach(() => {
    originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = TEST_SECRET;
    Bun.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
      delete Bun.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
      Bun.env.JWT_SECRET = originalSecret;
    }
  });

  test("GET /api/v1/ai/thresholds returns default thresholds for Organizer/Admin", async () => {
    const token = await makeToken("Organizer");
    const res = await app.request("/api/v1/ai/thresholds", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.aiGeneratedFlagThreshold).toBe(0.75);
    expect(body.data.duplicateMaxPhashDistance).toBe(5);
  });

  test("GET /api/v1/ai/thresholds forbids Participant (403)", async () => {
    const token = await makeToken("Participant");
    const res = await app.request("/api/v1/ai/thresholds", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  test("PUT /api/v1/ai/thresholds forbids Organizer (403)", async () => {
    const token = await makeToken("Organizer");
    const res = await app.request("/api/v1/ai/thresholds", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ aiGeneratedFlagThreshold: 0.8 }),
    });
    expect(res.status).toBe(403);
  });

  test("PUT /api/v1/ai/thresholds rejects invalid threshold range (400)", async () => {
    const token = await makeToken("Admin");
    const res = await app.request("/api/v1/ai/thresholds", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ aiGeneratedFlagThreshold: 1.5 }),
    });
    expect(res.status).toBe(400);
  });

  test("PUT /api/v1/ai/thresholds updates thresholds for Admin (200)", async () => {
    const token = await makeToken("Admin");
    const res = await app.request("/api/v1/ai/thresholds", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aiGeneratedFlagThreshold: 0.82,
        duplicateMaxPhashDistance: 4,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.aiGeneratedFlagThreshold).toBe(0.82);
    expect(body.data.duplicateMaxPhashDistance).toBe(4);
  });

  test("POST /api/v1/ai/scan/:submissionId rejects invalid UUID (400)", async () => {
    const token = await makeToken("Organizer");
    const res = await app.request("/api/v1/ai/scan/not-a-uuid", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  test("POST /api/v1/ai/scan/batch rejects invalid contestId (400)", async () => {
    const token = await makeToken("Organizer");
    const res = await app.request("/api/v1/ai/scan/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contestId: "bad-id" }),
    });
    expect(res.status).toBe(400);
  });
});
