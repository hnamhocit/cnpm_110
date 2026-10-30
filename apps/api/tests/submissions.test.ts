import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { sign } from "hono/jwt";
import { Hono } from "hono";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:@hn71LP10@localhost:5432/vntez_db";

const { default: submissionRoute } = await import(
  "../src/routes/submissions"
);

const TEST_SECRET = "fpc13-test-secret-at-least-32-characters";
let originalSecret: string | undefined;

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

async function createToken(role: string) {
  const payload = {
    id: "11111111-1111-1111-1111-111111111111",
    role,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return await sign(payload, TEST_SECRET, "HS256");
}

function createTestApp() {
  const app = new Hono();
  app.route("/api/v1/submissions", submissionRoute);
  return app;
}

describe("FPC-49: GET /api/v1/submissions (Organizer submission list & filters)", () => {
  const app = createTestApp();

  test("Requires authentication (401 when missing Authorization header)", async () => {
    const res = await app.request("/api/v1/submissions");
    expect(res.status).toBe(401);
  });

  test("Rejects non-organizer/non-admin roles (403 for Participant)", async () => {
    const token = await createToken("Participant");
    const res = await app.request("/api/v1/submissions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  test("Rejects invalid status parameter (400)", async () => {
    const token = await createToken("Organizer");
    const res = await app.request("/api/v1/submissions?status=INVALID_STATUS", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.code).toBe(400);
  });

  test("Rejects invalid aiFlagged parameter (400)", async () => {
    const token = await createToken("Organizer");
    const res = await app.request("/api/v1/submissions?aiFlagged=maybe", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
  });

  test("Rejects invalid UUID format for contestId (400)", async () => {
    const token = await createToken("Organizer");
    const res = await app.request("/api/v1/submissions?contestId=not-a-uuid", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  test("Accepts Organizer and returns submissions list with standard envelope (200)", async () => {
    const token = await createToken("Organizer");
    const res = await app.request("/api/v1/submissions?page=1&limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.code).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });
});

describe("FPC-50: POST /api/v1/submissions/:id/approve & reject (Approve/Reject with BR-18)", () => {
  const app = createTestApp();
  const testSubId = "99999999-9999-9999-9999-999999999999";

  test("Approve rejects non-organizer (403)", async () => {
    const token = await createToken("Participant");
    const res = await app.request(`/api/v1/submissions/${testSubId}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  test("Approve returns 404 for non-existent submission", async () => {
    const token = await createToken("Organizer");
    const res = await app.request(`/api/v1/submissions/${testSubId}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.code).toBe(404);
  });

  test("Reject returns 422 with MSG021 if reason is missing (BR-18)", async () => {
    const token = await createToken("Organizer");
    const res = await app.request(`/api/v1/submissions/${testSubId}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.code).toBe("MSG021");
  });

  test("Reject returns 422 with MSG021 if reason is shorter than 10 characters (BR-18)", async () => {
    const token = await createToken("Organizer");
    const res = await app.request(`/api/v1/submissions/${testSubId}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "too short" }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.code).toBe("MSG021");
  });

  test("Reject returns 404 for non-existent submission with valid reason", async () => {
    const token = await createToken("Organizer");
    const res = await app.request(`/api/v1/submissions/${testSubId}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Ảnh scan có viền đen bất thường, nghi vấn ảnh dựng đồ họa.",
      }),
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.code).toBe(404);
  });

  test("Moderate returns 422 with MSG021 for DISQUALIFY action without reason (BR-18)", async () => {
    const token = await createToken("Organizer");
    const res = await app.request(`/api/v1/submissions/${testSubId}/moderate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "DISQUALIFY" }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.code).toBe("MSG021");
  });
});
