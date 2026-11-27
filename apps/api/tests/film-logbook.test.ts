import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import {
  createAuthenticator,
  requirePermission,
  type AuthEnv,
} from "../src/middlewares/auth";
import {
  formatPushPullEv,
  getMaxFramesForFormat,
  validateFilmRollInput,
  validateFrameLogInput,
  validateRollStatusTransition,
} from "../src/services/film-logbook.validation";
import { AppError } from "../src/utils/errors";
import { attachResponseHelpers, errorResponse } from "../src/utils/result";

const TEST_SECRET = "test-film-logbook-secret";
const PARTICIPANT_ID = "22222222-2222-4222-8222-222222222222";

function createTestLogbookApp() {
  const app = new Hono<AuthEnv>();
  const auth = createAuthenticator(async () => true);

  app.use("*", attachResponseHelpers);
  app.onError((err, c) => {
    if (err instanceof AppError) return errorResponse(c, err.message, err.code);
    return errorResponse(c, "Internal Server Error", 500);
  });

  app.post(
    "/api/v1/film-rolls",
    auth,
    requirePermission("film-rolls:manage"),
    async (c) => {
      const validated = validateFilmRollInput(await c.req.json());
      return c.created(validated);
    },
  );

  return app;
}

async function makeToken(role: "Admin" | "Organizer" | "Judge" | "Participant") {
  return sign(
    {
      id: PARTICIPANT_ID,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    TEST_SECRET,
    "HS256",
  );
}

describe("M04 Film Logbook - Validation & Business Rules", () => {
  it("UC-35: validates film roll with customFilmName or filmStockId and computes Push/Pull EV", () => {
    const roll = validateFilmRollInput({
      customFilmName: "Kodak Portra 400",
      format: "135",
      isoRated: 400,
      isoShot: 800,
      devProcess: "C-41",
      loadDate: "2026-10-30",
    });
    expect(roll.format).toBe("135");
    expect(formatPushPullEv(roll.isoRated, roll.isoShot)).toBe(
      "+1 EV (Push 1 stop)",
    );
    expect(formatPushPullEv(400, 200)).toBe("-1 EV (Pull 1 stop)");
    expect(formatPushPullEv(400, 400)).toBe("0 EV (Box Speed)");
  });

  it("UC-35: rejects film roll missing both filmStockId and customFilmName", () => {
    expect(() =>
      validateFilmRollInput({
        format: "135",
        isoRated: 400,
        loadDate: "2026-10-30",
      }),
    ).toThrow("MSG002");
  });

  it("UC-35: enforces roll status transitions and DEVELOPED prerequisites", () => {
    expect(() =>
      validateRollStatusTransition("SHOOTING", "SCANNED", {
        loggedFramesCount: 5,
        devDate: "2026-11-01",
      }),
    ).toThrow("MSG002");

    expect(() =>
      validateRollStatusTransition("SHOOTING", "DEVELOPED", {
        loggedFramesCount: 0,
        devDate: "2026-11-01",
      }),
    ).toThrow("MSG002");

    expect(() =>
      validateRollStatusTransition("SHOOTING", "DEVELOPED", {
        loggedFramesCount: 1,
        devDate: null,
      }),
    ).toThrow("MSG002");

    expect(() =>
      validateRollStatusTransition("SHOOTING", "DEVELOPED", {
        loggedFramesCount: 1,
        devDate: "2026-11-01",
      }),
    ).not.toThrow();
  });

  it("UC-36: enforces BR-23 physical frame limits per film format", () => {
    expect(getMaxFramesForFormat("135")).toBe(39);
    expect(getMaxFramesForFormat("120_645")).toBe(16);
    expect(getMaxFramesForFormat("120_66")).toBe(12);
    expect(getMaxFramesForFormat("120_67")).toBe(10);
    expect(getMaxFramesForFormat("4x5")).toBe(1);

    const validFrame = validateFrameLogInput(
      {
        frameNumber: 39,
        aperture: "f/2.8",
        shutterSpeed: "1/250s",
        locationName: "Da Lat",
      },
      "135",
    );
    expect(validFrame.frameNumber).toBe(39);

    expect(() =>
      validateFrameLogInput({ frameNumber: 40 }, "135"),
    ).toThrow("MSG010");

    expect(() =>
      validateFrameLogInput({ frameNumber: 13 }, "120_66"),
    ).toThrow("MSG010");

    expect(() =>
      validateFrameLogInput({ frameNumber: 2 }, "4x5"),
    ).toThrow("MSG010");
  });

  it("UC-36: rejects non-positive or non-integer frameNumber", () => {
    expect(() =>
      validateFrameLogInput({ frameNumber: 0 }, "135"),
    ).toThrow("MSG002");
    expect(() =>
      validateFrameLogInput({ frameNumber: -1 }, "135"),
    ).toThrow("MSG002");
    expect(() =>
      validateFrameLogInput({ frameNumber: 1.5 }, "135"),
    ).toThrow("MSG002");
  });
});

describe("M04 Film Logbook - RBAC", () => {
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
    const app = createTestLogbookApp();
    const res = await app.request("/api/v1/film-rolls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("allows Participant and rejects non-Participant roles with 403", async () => {
    const app = createTestLogbookApp();
    const payload = {
      customFilmName: "Ilford HP5 Plus",
      format: "135",
      isoRated: 400,
      loadDate: "2026-10-30",
    };

    for (const role of ["Admin", "Organizer", "Judge"] as const) {
      const token = await makeToken(role);
      const res = await app.request("/api/v1/film-rolls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      expect(res.status).toBe(403);
    }

    const participantToken = await makeToken("Participant");
    const okRes = await app.request("/api/v1/film-rolls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${participantToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    expect(okRes.status).toBe(201);
  });
});
