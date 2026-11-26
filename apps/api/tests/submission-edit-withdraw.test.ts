if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/film_contest";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "acceptance-super-secret-key-that-is-at-least-32-chars-long";
}
if (!Bun.env.JWT_SECRET) {
  Bun.env.JWT_SECRET = "acceptance-super-secret-key-that-is-at-least-32-chars-long";
}

import { describe, expect, test, spyOn } from "bun:test";
import { sign } from "hono/jwt";
import { createTestApp } from "./helpers/test-app";
import { pool } from "../src/db";
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
    let queryIndex = 0;
    const mockClient = {
      query: async () => {
        queryIndex++;
        if (queryIndex === 1) {
          return {
            rowCount: 1,
            rows: [{ id: "a95fec4f-30e7-4e80-9fd2-3a8631d59c86", role: "Participant", token_version: 0, tokenVersion: 0 }],
          };
        }
        return { rowCount: 0, rows: [] };
      },
      release: () => {},
    };
    const connectSpy = spyOn(pool, "connect").mockImplementation(async () => mockClient as any);
    const querySpy = spyOn(pool, "query").mockImplementation(async () => {
      queryIndex++;
      if (queryIndex === 1) {
        return {
          rowCount: 1,
          rows: [{ id: "a95fec4f-30e7-4e80-9fd2-3a8631d59c86", role: "Participant", token_version: 0, tokenVersion: 0 }],
        } as any;
      }
      return { rowCount: 0, rows: [] } as any;
    });

    try {
      const res = await app.request("/api/v1/submissions/ffffffff-ffff-4fff-8fff-ffffffffffff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Title" }),
      });
      const json = await res.json();
      expect(res.status).toBe(404);
    } finally {
      connectSpy.mockRestore();
      querySpy.mockRestore();
    }
  });

  test("UC-39: Withdraw submission returns 404 when submission does not exist", async () => {
    const token = await createToken();
    let queryIndex = 0;
    const mockClient = {
      query: async () => {
        queryIndex++;
        if (queryIndex === 1) {
          return {
            rowCount: 1,
            rows: [{ id: "a95fec4f-30e7-4e80-9fd2-3a8631d59c86", role: "Participant", token_version: 0, tokenVersion: 0 }],
          };
        }
        return { rowCount: 0, rows: [] };
      },
      release: () => {},
    };
    const connectSpy = spyOn(pool, "connect").mockImplementation(async () => mockClient as any);
    const querySpy = spyOn(pool, "query").mockImplementation(async () => {
      queryIndex++;
      if (queryIndex === 1) {
        return {
          rowCount: 1,
          rows: [{ id: "a95fec4f-30e7-4e80-9fd2-3a8631d59c86", role: "Participant", token_version: 0, tokenVersion: 0 }],
        } as any;
      }
      return { rowCount: 0, rows: [] } as any;
    });

    try {
      const res = await app.request("/api/v1/submissions/ffffffff-ffff-4fff-8fff-ffffffffffff/withdraw", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      expect(res.status).toBe(404);
    } finally {
      connectSpy.mockRestore();
      querySpy.mockRestore();
    }
  });
});
