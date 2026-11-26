import { describe, expect, test } from "bun:test";
import { sign } from "hono/jwt";
import { createTestApp } from "./helpers/test-app";
import submissionsRoute from "../src/routes/submissions.route";

const TEST_SECRET = "acceptance-super-secret-key-that-is-at-least-32-chars-long";

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

describe("FPC-096: Submission Edit & Withdraw (UC-39, BR-24)", () => {
  const app = createTestApp();
  app.route("/api/v1/submissions", submissionsRoute);

  test("UC-39: Edit submission rejects when unauthenticated (401)", async () => {
    const res = await app.request("/api/v1/submissions/b2222222-2222-4222-8222-222222222222", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });
    expect(res.status).toBe(401);
  });

  test("UC-39: Withdraw submission via POST rejects when unauthenticated (401)", async () => {
    const res = await app.request("/api/v1/submissions/b2222222-2222-4222-8222-222222222222/withdraw", {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });

  test("UC-39: Withdraw submission via DELETE rejects when unauthenticated (401)", async () => {
    const res = await app.request("/api/v1/submissions/b2222222-2222-4222-8222-222222222222", {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  test("UC-39: Edit submission returns 404 when submission does not exist", async () => {
    const token = await createToken();
    const res = await app.request("/api/v1/submissions/ffffffff-ffff-4fff-8fff-ffffffffffff", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: "New Title" }),
    });
    expect(res.status).toBe(404);
  });

  test("UC-39: Withdraw submission returns 404 when submission does not exist", async () => {
    const token = await createToken();
    const res = await app.request("/api/v1/submissions/ffffffff-ffff-4fff-8fff-ffffffffffff/withdraw", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(res.status).toBe(404);
  });
});
