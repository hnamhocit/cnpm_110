import { describe, expect, test } from "bun:test";

import { buildMasterDataCode } from "@/lib/master-data-format";
import {
  hasFieldErrors,
  validateCamera,
  validateFilmLab,
  validateFilmStock,
  validateLens,
} from "@/lib/master-data-validation";
import type {
  CameraInput,
  FilmLabInput,
  FilmStockInput,
  LensInput,
} from "@/types/master-data";

const filmStock: FilmStockInput = {
  brand: "Kodak",
  name: "Portra 400",
  nominal_iso: 400,
  process: "C-41",
  color_type: "COLOR_NEGATIVE",
  supported_formats: ["135", "120"],
  is_dx_coded: true,
  description: "",
};

const camera: CameraInput = {
  brand: "Leica",
  model: "M6 Classic",
  camera_type: "RANGEFINDER",
  supported_format: "135",
  default_lens_mount: "Leica M",
  has_fixed_lens: false,
  fixed_lens_specs: null,
  shutter_mechanism: "MECHANICAL",
  production_start_year: 1984,
  production_end_year: 1998,
};

const lens: LensInput = {
  brand: "Leica",
  model: "Summicron-M 35mm f/2 ASPH",
  mount_type: "Leica M",
  focal_length_min_mm: 35,
  focal_length_max_mm: null,
  is_prime: true,
  max_aperture: 2,
  min_aperture: 16,
  format_coverage: ["135"],
};

const filmLab: FilmLabInput = {
  name: "LLab Saigon",
  country_code: "VN",
  city: "Ho Chi Minh City",
  address: "Quận 3",
  website_url: "https://llab.vn",
  email: "contact@llab.vn",
  phone: "+84903123456",
  supported_processes: ["C-41", "B&W"],
  scanners: ["NORITSU_HS1800"],
};

describe("FPC-081 validateFilmStock (UC-06, BR-02/03)", () => {
  test("chấp nhận dữ liệu hợp lệ", () => {
    expect(hasFieldErrors(validateFilmStock(filmStock))).toBe(false);
  });

  test("B&W bắt buộc color_type BLACK_AND_WHITE", () => {
    const errors = validateFilmStock({
      ...filmStock,
      process: "B&W",
      color_type: "COLOR_NEGATIVE",
    });
    expect(errors.color_type?.code).toBe("ERR_PROCESS_MISMATCH");
  });

  test("ECN-2 bắt buộc MOTION_PICTURE_COLOR", () => {
    const mismatch = validateFilmStock({
      ...filmStock,
      process: "ECN-2",
      color_type: "COLOR_NEGATIVE",
    });
    expect(mismatch.color_type?.code).toBe("ERR_PROCESS_MISMATCH");

    const valid = validateFilmStock({
      ...filmStock,
      process: "ECN-2",
      color_type: "MOTION_PICTURE_COLOR",
    });
    expect(hasFieldErrors(valid)).toBe(false);
  });

  test("ISO ngoài khoảng 6–12800 bị từ chối (MSG002)", () => {
    expect(
      validateFilmStock({ ...filmStock, nominal_iso: 5 }).nominal_iso?.code,
    ).toBe("ERR_VALIDATION_FAILED");
    expect(
      validateFilmStock({ ...filmStock, nominal_iso: 12800 }).nominal_iso,
    ).toBeUndefined();
  });

  test("khổ phim rỗng bị từ chối", () => {
    expect(
      validateFilmStock({ ...filmStock, supported_formats: [] })
        .supported_formats?.code,
    ).toBe("MSG002");
  });

  test("hãng chứa ký tự nguy hiểm bị từ chối", () => {
    expect(
      validateFilmStock({ ...filmStock, brand: "<Kodak>" }).brand?.code,
    ).toBe("ERR_VALIDATION_FAILED");
  });
});

describe("FPC-081 validateCamera (UC-07, BR-02/22)", () => {
  test("chấp nhận dữ liệu hợp lệ", () => {
    expect(hasFieldErrors(validateCamera(camera))).toBe(false);
  });

  test("fixed lens bắt buộc ngàm Fixed và thông số >= 5 ký tự", () => {
    const missingSpecs = validateCamera({
      ...camera,
      has_fixed_lens: true,
      default_lens_mount: "Leica M",
      fixed_lens_specs: "",
    });
    expect(missingSpecs.default_lens_mount?.code).toBe("ERR_VALIDATION_FAILED");
    expect(missingSpecs.fixed_lens_specs?.code).toBe("MSG002");

    const valid = validateCamera({
      ...camera,
      has_fixed_lens: true,
      default_lens_mount: "Fixed",
      fixed_lens_specs: "F.Zuiko 38mm f/1.8",
    });
    expect(hasFieldErrors(valid)).toBe(false);
  });

  test("năm sản xuất phải đúng thứ tự và trong khoảng 1850–năm sau", () => {
    expect(
      validateCamera({
        ...camera,
        production_start_year: 2000,
        production_end_year: 1990,
      }).production_end_year?.code,
    ).toBe("ERR_VALIDATION_FAILED");

    expect(
      validateCamera({ ...camera, production_start_year: 1849 })
        .production_start_year?.code,
    ).toBe("ERR_VALIDATION_FAILED");
  });
});

describe("FPC-081 validateLens (UC-07)", () => {
  test("chấp nhận dữ liệu hợp lệ", () => {
    expect(hasFieldErrors(validateLens(lens))).toBe(false);
  });

  test("prime không được có tiêu cự lớn nhất khác tiêu cự nhỏ nhất", () => {
    expect(
      validateLens({ ...lens, focal_length_max_mm: 50 }).focal_length_max_mm
        ?.code,
    ).toBe("ERR_VALIDATION_FAILED");
  });

  test("zoom bắt buộc max > min", () => {
    expect(
      validateLens({ ...lens, is_prime: false, focal_length_max_mm: null })
        .focal_length_max_mm?.code,
    ).toBe("ERR_VALIDATION_FAILED");

    expect(
      validateLens({ ...lens, is_prime: false, focal_length_max_mm: 24 })
        .focal_length_max_mm?.code,
    ).toBe("ERR_VALIDATION_FAILED");
  });

  test("khẩu độ khép nhỏ nhất phải lớn hơn khẩu độ tối đa", () => {
    expect(
      validateLens({ ...lens, min_aperture: 1.4 }).min_aperture?.code,
    ).toBe("ERR_VALIDATION_FAILED");
  });

  test("tiêu cự ngoài khoảng 4–2000mm bị từ chối", () => {
    expect(
      validateLens({ ...lens, focal_length_min_mm: 3 }).focal_length_min_mm
        ?.code,
    ).toBe("ERR_VALIDATION_FAILED");
  });
});

describe("FPC-081 validateFilmLab (UC-08, BR-02/22)", () => {
  test("chấp nhận dữ liệu hợp lệ", () => {
    expect(hasFieldErrors(validateFilmLab(filmLab))).toBe(false);
  });

  test("mã quốc gia phải là 2 chữ cái ISO 3166-1 alpha-2", () => {
    expect(
      validateFilmLab({ ...filmLab, country_code: "VNM" }).country_code?.code,
    ).toBe("ERR_VALIDATION_FAILED");
    expect(
      validateFilmLab({ ...filmLab, country_code: "vn" }).country_code,
    ).toBeUndefined();
  });

  test("quy trình tráng và máy quét không được rỗng", () => {
    expect(
      validateFilmLab({ ...filmLab, supported_processes: [] })
        .supported_processes?.code,
    ).toBe("MSG002");
    expect(validateFilmLab({ ...filmLab, scanners: [] }).scanners?.code).toBe(
      "MSG002",
    );
  });

  test("email/website sai định dạng bị từ chối", () => {
    expect(validateFilmLab({ ...filmLab, email: "contact@" }).email?.code).toBe(
      "ERR_VALIDATION_FAILED",
    );
    expect(
      validateFilmLab({ ...filmLab, website_url: "llab.vn" }).website_url?.code,
    ).toBe("ERR_VALIDATION_FAILED");
  });
});

describe("FPC-081 buildMasterDataCode (CR-05)", () => {
  test("sinh mã xem trước cho từng thực thể", () => {
    expect(buildMasterDataCode("film-stocks", filmStock)).toBe(
      "FILM-KODAK-PORTRA-400",
    );
    expect(buildMasterDataCode("cameras", camera)).toBe("CAM-LEICA-M6-CLASSIC");
    expect(buildMasterDataCode("lenses", lens)).toBe(
      "LENS-LEICA-SUMMICRON-M-35MM-F2-ASPH-35MM",
    );
    expect(buildMasterDataCode("film-labs", filmLab)).toBe(
      "LAB-VN-LLAB-SAIGON-HO-CHI-MINH-CITY",
    );
  });
});
