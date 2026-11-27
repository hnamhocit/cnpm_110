import { describe, expect, test, spyOn } from "bun:test";
import { createTestApp } from "./helpers/test-app";
import { pool } from "../src/db";
import exhibitionsRoute from "../src/routes/exhibitions.route";

describe("FPC-112/114/115: Public Digital Archive & Filters (UC-43, BR-17)", () => {
  const app = createTestApp();
  app.route("/api/v1/exhibitions", exhibitionsRoute);

  test("UC-43: Detail endpoint returns 404 when item does not exist", async () => {
    const querySpy = spyOn(pool, "query").mockImplementation(async () => {
      return { rowCount: 0, rows: [] } as any;
    });

    try {
      const res = await app.request("/api/v1/exhibitions/ffffffff-ffff-4fff-8fff-ffffffffffff");
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe(404);
      expect(json.message).toContain("not found");
    } finally {
      querySpy.mockRestore();
    }
  });

  test("UC-43: Detail endpoint returns 400 for invalid UUID format", async () => {
    const res = await app.request("/api/v1/exhibitions/invalid-uuid-format");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe(400);
    expect(json.message).toContain("Invalid exhibition ID");
  });

  test("UC-43: Image preview endpoint returns 400 for invalid UUID format", async () => {
    const res = await app.request("/api/v1/exhibitions/invalid-uuid/image");
    expect(res.status).toBe(400);
  });

  test("UC-43: Organizer process image requires authentication (401)", async () => {
    const res = await app.request("/api/v1/exhibitions/550e8400-e29b-41d4-a716-446655440000/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generateWebp: true }),
    });
    expect(res.status).toBe(401);
  });

  test("UC-43: Organizer status check requires authentication (401)", async () => {
    const res = await app.request("/api/v1/exhibitions/550e8400-e29b-41d4-a716-446655440000/status");
    expect(res.status).toBe(401);
  });

  test("UC-43: Organizer delete exhibition requires authentication (401)", async () => {
    const res = await app.request("/api/v1/exhibitions/550e8400-e29b-41d4-a716-446655440000", {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });
});
