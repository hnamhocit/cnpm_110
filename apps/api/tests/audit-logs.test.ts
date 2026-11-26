import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import {
  createAuthenticator,
  requirePermission,
  type AuthEnv,
} from "../src/middlewares/auth";
import {
  sanitizeAuditData,
  validateAuditLogQuery,
} from "../src/services/audit-logs.validation";
import { AppError } from "../src/utils/errors";
import { attachResponseHelpers, errorResponse } from "../src/utils/result";

const TEST_SECRET = "test-audit-secret";
const USER_ID = "33333333-3333-4333-8333-333333333333";

function createTestAuditApp() {
  const app = new Hono<AuthEnv>();
  const auth = createAuthenticator(async () => true);

  app.use("*", attachResponseHelpers);
  app.onError((err, c) => {
    if (err instanceof AppError) return errorResponse(c, err.message, err.code);
    return errorResponse(c, "Internal Server Error", 500);
  });

  app.get(
    "/api/v1/audit-logs",
    auth,
    requirePermission("audit-logs:read"),
    (c) => {
      const validated = validateAuditLogQuery({
        actorId: c.req.query("actorId") || undefined,
        from: c.req.query("from") || undefined,
        to: c.req.query("to") || undefined,
      });
      return c.ok({ items: [], query: validated });
    },
  );

  return app;
}

async function makeToken(role: "Admin" | "Organizer" | "Judge" | "Participant") {
  return sign(
    {
      id: USER_ID,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    TEST_SECRET,
    "HS256",
  );
}

describe("M11 Audit Logs (UC-10)", () => {
  it("redacts sensitive fields recursively from audit snapshots", () => {
    const cleaned = sanitizeAuditData({
      email: "user@example.com",
      password: "secret123",
      passwordHash: "hash",
      nested: {
        refreshToken: "tok",
        apiKey: "key",
        role: "Admin",
      },
    });
    expect(cleaned).toEqual({
      email: "user@example.com",
      password: "[REDACTED]",
      passwordHash: "[REDACTED]",
      nested: {
        refreshToken: "[REDACTED]",
        apiKey: "[REDACTED]",
        role: "Admin",
      },
    });
  });

  it("validates actorId UUID and date range filters", () => {
    expect(() => validateAuditLogQuery({ actorId: "not-a-uuid" })).toThrow(
      "MSG002",
    );
    expect(() => validateAuditLogQuery({ from: "invalid-date" })).toThrow(
      "MSG002",
    );
    expect(() =>
      validateAuditLogQuery({
        from: "2026-11-10T00:00:00Z",
        to: "2026-11-01T00:00:00Z",
      }),
    ).toThrow("MSG002");

    const ok = validateAuditLogQuery({
      actorId: USER_ID,
      from: "2026-11-01T00:00:00Z",
      to: "2026-11-10T00:00:00Z",
      page: 2,
      limit: 50,
    });
    expect(ok.page).toBe(2);
    expect(ok.limit).toBe(50);
  });

  describe("RBAC", () => {
    let prevSecret: string | undefined;

    beforeEach(() => {
      prevSecret = Bun.env.JWT_SECRET;
      Bun.env.JWT_SECRET = TEST_SECRET;
    });

    afterEach(() => {
      if (prevSecret === undefined) delete Bun.env.JWT_SECRET;
      else Bun.env.JWT_SECRET = prevSecret;
    });

    it("rejects unauthenticated requests with 401", async () => {
      const app = createTestAuditApp();
      const res = await app.request("/api/v1/audit-logs");
      expect(res.status).toBe(401);
    });

    it("allows Admin and rejects Organizer, Judge, Participant with 403", async () => {
      const app = createTestAuditApp();
      for (const role of ["Organizer", "Judge", "Participant"] as const) {
        const token = await makeToken(role);
        const res = await app.request("/api/v1/audit-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.status).toBe(403);
      }

      const adminToken = await makeToken("Admin");
      const okRes = await app.request("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(okRes.status).toBe(200);
    });
  });
});
