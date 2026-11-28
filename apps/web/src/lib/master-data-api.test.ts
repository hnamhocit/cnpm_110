import { describe, expect, spyOn, test } from "bun:test";

import { http } from "@/lib/http";
import {
  createMasterData,
  listMasterData,
  normalizeMasterDataKeys,
} from "@/lib/master-data-api";
import type { FilmStock } from "@/types/master-data";

const camelFilmStock = {
  id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  code: "FILM-KODAK-PORTRA-400",
  brand: "Kodak",
  name: "Portra 400",
  nominalIso: 400,
  process: "C-41",
  colorType: "COLOR_NEGATIVE",
  supportedFormats: ["135", "120"],
  isDxCoded: true,
  createdAt: "2026-01-15T08:30:00Z",
  updatedAt: "2026-01-15T08:30:00Z",
  isDeleted: false,
};

function fields(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

describe("FPC-126 master data API normalization (UC-06)", () => {
  test("normalize camelCase items từ API sang snake_case", async () => {
    const get = spyOn(http, "get").mockResolvedValue({
      data: { data: [camelFilmStock] },
    } as never);

    try {
      const result = await listMasterData<FilmStock>("film-stocks");
      const item = fields(result.items[0]);

      expect(item.supported_formats).toEqual(["135", "120"]);
      expect(item.nominal_iso).toBe(400);
      expect(item.color_type).toBe("COLOR_NEGATIVE");
      expect(item.is_dx_coded).toBe(true);
      expect(item.created_at).toBe("2026-01-15T08:30:00Z");
      expect(item.supportedFormats).toEqual(["135", "120"]);
    } finally {
      get.mockRestore();
    }
  });

  test("giữ nguyên item đã dùng snake_case", async () => {
    const snakeFilmStock: FilmStock = {
      id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      code: "FILM-KODAK-PORTRA-400",
      status: "ACTIVE",
      brand: "Kodak",
      name: "Portra 400",
      nominal_iso: 400,
      process: "C-41",
      color_type: "COLOR_NEGATIVE",
      supported_formats: ["135", "120"],
      is_dx_coded: true,
    };
    const get = spyOn(http, "get").mockResolvedValue({
      data: { data: [snakeFilmStock] },
    } as never);

    try {
      const result = await listMasterData<FilmStock>("film-stocks");
      expect(result.items[0]).toEqual(snakeFilmStock);
    } finally {
      get.mockRestore();
    }
  });

  test("ưu tiên snake_case khi camelCase và snake_case cùng tồn tại", () => {
    const item = fields(
      normalizeMasterDataKeys({
        nominalIso: 400,
        nominal_iso: 200,
        colorType: "COLOR_NEGATIVE",
        color_type: "BLACK_AND_WHITE",
        supportedFormats: ["135"],
        supported_formats: ["120"],
      }),
    );

    expect(item.nominal_iso).toBe(200);
    expect(item.color_type).toBe("BLACK_AND_WHITE");
    expect(item.supported_formats).toEqual(["120"]);
    expect(item.nominalIso).toBe(400);
  });

  test("normalize cả object trả về từ mutation", async () => {
    const post = spyOn(http, "post").mockResolvedValue({
      data: { data: camelFilmStock },
    } as never);

    try {
      const item = fields(
        await createMasterData<FilmStock>("film-stocks", {
          brand: "Kodak",
          name: "Portra 400",
          nominal_iso: 400,
          process: "C-41",
          color_type: "COLOR_NEGATIVE",
          supported_formats: ["135", "120"],
          is_dx_coded: true,
        }),
      );

      expect(item.supported_formats).toEqual(["135", "120"]);
      expect(item.nominal_iso).toBe(400);
      expect(item.color_type).toBe("COLOR_NEGATIVE");
    } finally {
      post.mockRestore();
    }
  });
});
