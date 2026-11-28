import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { env } from "../src/config/env";
import {
  toCameraDto,
  toFilmLabDto,
  toFilmStockDto,
  toLensDto,
} from "../src/services/master-data.dto";
import {
  createAuthenticator,
  requirePermission,
  type AuthEnv,
} from "../src/middlewares/auth";
import {
  validateCameraInput,
  validateFilmLabInput,
  validateFilmStockInput,
  validateLensInput,
} from "../src/services/master-data.validation";
import { AppError } from "../src/utils/errors";
import { attachResponseHelpers, errorResponse } from "../src/utils/result";

const TEST_SECRET = env.jwtSecret;
const USER_ID = "11111111-1111-4111-8111-111111111111";

function createTestRbacApp() {
  const app = new Hono<AuthEnv>();
  const auth = createAuthenticator(async () => true);

  app.use("*", attachResponseHelpers);
  app.onError((err, c) => {
    if (err instanceof AppError) return errorResponse(c, err.message, err.code);
    return errorResponse(c, "Internal Server Error", 500);
  });

  app.post(
    "/api/v1/master-data/film-stocks",
    auth,
    requirePermission("master-data:manage"),
    async (c) => {
      const validated = validateFilmStockInput(await c.req.json());
      return c.created(validated);
    },
  );

  app.delete(
    "/api/v1/master-data/film-stocks/:id",
    auth,
    requirePermission("master-data:manage"),
    (c) => {
      const id = c.req.param("id");
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
        throw AppError.badRequest("MSG002: Invalid film stock ID");
      }
      return c.ok({ id, isDeleted: true, status: "DEPRECATED" });
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

describe("M02 Analog Master Data - Validation & Business Rules", () => {
  it("UC-06: validates valid C-41 film stock and builds standard code", () => {
    const result = validateFilmStockInput({
      brand: "Kodak",
      name: "Portra 400",
      nominal_iso: 400,
      process: "C-41",
      color_type: "COLOR_NEGATIVE",
      supported_formats: ["135", "120"],
    });
    expect(result.code).toBe("FILM-KODAK-PORTRA-400-400");
    expect(result.status).toBe("ACTIVE");
    expect(result.supportedFormats).toEqual(["135", "120"]);
  });

  it("UC-06: rejects ECN-2 process with non-motion-picture color type (422)", () => {
    expect(() =>
      validateFilmStockInput({
        brand: "CineStill",
        name: "800T",
        nominal_iso: 800,
        process: "ECN-2",
        color_type: "COLOR_NEGATIVE",
        supported_formats: ["135"],
      }),
    ).toThrow("ERR_PROCESS_MISMATCH");
  });

  it("UC-06: rejects B&W process with non-B&W color type (422)", () => {
    expect(() =>
      validateFilmStockInput({
        brand: "Ilford",
        name: "HP5 Plus",
        nominal_iso: 400,
        process: "B&W",
        color_type: "COLOR_NEGATIVE",
        supported_formats: ["135"],
      }),
    ).toThrow("ERR_PROCESS_MISMATCH");
  });

  it("UC-06: rejects out-of-range ISO or dangerous characters", () => {
    expect(() =>
      validateFilmStockInput({
        brand: "Kodak",
        name: "Ultra",
        nominal_iso: 25600,
        process: "C-41",
        color_type: "COLOR_NEGATIVE",
      }),
    ).toThrow("MSG002");

    expect(() =>
      validateFilmStockInput({
        brand: "<script>",
        name: "Portra",
        nominal_iso: 400,
        process: "C-41",
        color_type: "COLOR_NEGATIVE",
      }),
    ).toThrow("MSG002");
  });

  it("UC-07: validates camera and enforces fixed_lens_specs when has_fixed_lens is true", () => {
    const fixedCam = validateCameraInput({
      brand: "Olympus",
      model: "Trip 35",
      camera_type: "POINT_AND_SHOOT",
      supported_format: "135",
      has_fixed_lens: true,
      fixed_lens_specs: "D.Zuiko 40mm f/2.8",
    });
    expect(fixedCam.defaultLensMount).toBe("Fixed");
    expect(fixedCam.code).toBe("CAM-OLYMPUS-TRIP-35");

    expect(() =>
      validateCameraInput({
        brand: "Olympus",
        model: "Trip 35",
        camera_type: "POINT_AND_SHOOT",
        supported_format: "135",
        has_fixed_lens: true,
      }),
    ).toThrow("MSG002");
  });

  it("UC-07: rejects camera when production_end_year < production_start_year", () => {
    expect(() =>
      validateCameraInput({
        brand: "Nikon",
        model: "F3",
        camera_type: "SLR",
        supported_format: "135",
        production_start_year: 1990,
        production_end_year: 1980,
      }),
    ).toThrow("MSG002");
  });

  it("UC-07: validates prime vs zoom lenses and aperture ordering", () => {
    const prime = validateLensInput({
      brand: "Leica",
      model: "Summicron-M 35mm f/2",
      mount_type: "Leica M",
      focal_length_min_mm: 35,
      is_prime: true,
      max_aperture: 2.0,
      min_aperture: 16.0,
    });
    expect(prime.focalLengthMaxMm).toBeNull();
    expect(prime.code).toBe("LENS-LEICA-SUMMICRON-M-35MM-F-2");

    expect(() =>
      validateLensInput({
        brand: "Nikon",
        model: "Zoom-Nikkor 35-70mm",
        mount_type: "Nikon F",
        focal_length_min_mm: 35,
        is_prime: false,
        max_aperture: 3.5,
      }),
    ).toThrow("MSG002");

    expect(() =>
      validateLensInput({
        brand: "Nikon",
        model: "Nikkor 50mm",
        mount_type: "Nikon F",
        focal_length_min_mm: 50,
        is_prime: true,
        max_aperture: 2.8,
        min_aperture: 1.4,
      }),
    ).toThrow("MSG002");
  });

  it("UC-08: validates film lab country_code, processes, and scanners", () => {
    const lab = validateFilmLabInput({
      name: "LLab Saigon",
      country_code: "VN",
      city: "Ho Chi Minh City",
      supported_processes: ["C-41", "B&W"],
      scanners: ["NORITSU_HS1800"],
      is_verified_partner: true,
    });
    expect(lab.code).toBe("LAB-VN-LLAB-SAIGON-HO-CHI-MINH-CITY");
    expect(lab.isVerifiedPartner).toBe(true);

    expect(() =>
      validateFilmLabInput({
        name: "Bad Lab",
        country_code: "vn",
        city: "Hanoi",
        supported_processes: ["C-41"],
        scanners: ["NORITSU_HS1800"],
      }),
    ).toThrow("MSG002");
  });
});

describe("M02 Analog Master Data - RBAC (BR-02)", () => {
  let prevSecret: string | undefined;

  beforeEach(() => {
    prevSecret = Bun.env.JWT_SECRET;
    Bun.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    if (prevSecret === undefined) delete Bun.env.JWT_SECRET;
    else Bun.env.JWT_SECRET = prevSecret;
  });

  it("rejects unauthenticated mutation with 401", async () => {
    const app = createTestRbacApp();
    const res = await app.request("/api/v1/master-data/film-stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("rejects Participant and Organizer mutations with 403", async () => {
    const app = createTestRbacApp();
    for (const role of ["Participant", "Organizer", "Judge"] as const) {
      const token = await makeToken(role);
      const res = await app.request("/api/v1/master-data/film-stocks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: "Kodak",
          name: "Gold 200",
          nominal_iso: 200,
          process: "C-41",
          color_type: "COLOR_NEGATIVE",
        }),
      });
      expect(res.status).toBe(403);
    }
  });

  it("allows Admin to create and soft-delete film stock", async () => {
    const app = createTestRbacApp();
    const token = await makeToken("Admin");

    const createRes = await app.request("/api/v1/master-data/film-stocks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brand: "Kodak",
        name: "Gold 200",
        nominal_iso: 200,
        process: "C-41",
        color_type: "COLOR_NEGATIVE",
      }),
    });
    expect(createRes.status).toBe(201);

    const deleteRes = await app.request(
      `/api/v1/master-data/film-stocks/${USER_ID}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(deleteRes.status).toBe(200);
    const body = (await deleteRes.json()) as { data: { isDeleted: boolean } };
    expect(body.data.isDeleted).toBe(true);
  });
});

describe("M02 Analog Master Data - snake_case DTO Serialization", () => {
  const now = new Date("2026-11-28T05:00:00.000Z");

  function assertNoCamelCaseKeys(obj: object) {
    for (const key of Object.keys(obj)) {
      expect(key).toBe(key.toLowerCase());
    }
  }

  it("serializes FilmStock in snake_case without camelCase keys", () => {
    const dto = toFilmStockDto({
      id: USER_ID,
      code: "FILM-KODAK-PORTRA-400",
      brand: "Kodak",
      name: "Portra 400",
      nominalIso: 400,
      process: "C-41",
      colorType: "COLOR_NEGATIVE",
      supportedFormats: ["135", "120"],
      isDxCoded: true,
      description: null,
      status: "ACTIVE",
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
      updatedBy: USER_ID,
      version: 1,
    });
    assertNoCamelCaseKeys(dto);
    expect(dto.nominal_iso).toBe(400);
    expect(dto.color_type).toBe("COLOR_NEGATIVE");
    expect(dto.supported_formats).toEqual(["135", "120"]);
    expect(dto.is_dx_coded).toBe(true);
    expect(dto.is_deleted).toBe(false);
    expect(dto.created_at).toEqual(now);
  });

  it("serializes Camera in snake_case without camelCase keys", () => {
    const dto = toCameraDto({
      id: USER_ID,
      code: "CAM-LEICA-M6",
      brand: "Leica",
      model: "M6",
      cameraType: "RANGEFINDER",
      supportedFormat: "135",
      defaultLensMount: "Leica M",
      hasFixedLens: false,
      fixedLensSpecs: null,
      shutterMechanism: "MECHANICAL",
      productionStartYear: 1984,
      productionEndYear: 1998,
      status: "ACTIVE",
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
      updatedBy: USER_ID,
      version: 1,
    });
    assertNoCamelCaseKeys(dto);
    expect(dto.camera_type).toBe("RANGEFINDER");
    expect(dto.supported_format).toBe("135");
    expect(dto.default_lens_mount).toBe("Leica M");
    expect(dto.has_fixed_lens).toBe(false);
    expect(dto.shutter_mechanism).toBe("MECHANICAL");
    expect(dto.production_start_year).toBe(1984);
    expect(dto.production_end_year).toBe(1998);
  });

  it("serializes Lens in snake_case with numeric fields as numbers", () => {
    const dto = toLensDto({
      id: USER_ID,
      code: "LENS-LEICA-35",
      brand: "Leica",
      model: "Summicron 35mm",
      mountType: "Leica M",
      focalLengthMinMm: "35.00",
      focalLengthMaxMm: null,
      isPrime: true,
      maxAperture: "2.0",
      minAperture: "16.0",
      formatCoverage: ["135"],
      status: "ACTIVE",
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
      updatedBy: USER_ID,
      version: 1,
    });
    assertNoCamelCaseKeys(dto);
    expect(dto.mount_type).toBe("Leica M");
    expect(dto.focal_length_min_mm).toBe(35);
    expect(typeof dto.focal_length_min_mm).toBe("number");
    expect(dto.focal_length_max_mm).toBeNull();
    expect(dto.is_prime).toBe(true);
    expect(dto.max_aperture).toBe(2);
    expect(dto.min_aperture).toBe(16);
    expect(dto.format_coverage).toEqual(["135"]);
  });

  it("serializes FilmLab in snake_case without camelCase keys", () => {
    const dto = toFilmLabDto({
      id: USER_ID,
      code: "LAB-VN-LLAB",
      name: "LLab Saigon",
      countryCode: "VN",
      city: "Ho Chi Minh City",
      address: null,
      websiteUrl: "https://llab.vn",
      email: null,
      phone: null,
      supportedProcesses: ["C-41", "B&W"],
      scanners: ["NORITSU_HS1800"],
      isVerifiedPartner: true,
      status: "ACTIVE",
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
      updatedBy: USER_ID,
      version: 1,
    });
    assertNoCamelCaseKeys(dto);
    expect(dto.country_code).toBe("VN");
    expect(dto.website_url).toBe("https://llab.vn");
    expect(dto.supported_processes).toEqual(["C-41", "B&W"]);
    expect(dto.is_verified_partner).toBe(true);
  });
});
