import {
  CAMERA_TYPES,
  type CameraInput,
  COLOR_TYPES,
  FILM_FORMATS,
  FILM_PROCESSES,
  type FilmLabInput,
  type FilmStockInput,
  type LensInput,
  type MasterDataEntity,
  type MasterDataInput,
  SCANNERS,
  SHUTTER_MECHANISMS,
} from "@/types/master-data";

export type FieldErrorCode =
  | "MSG002"
  | "ERR_VALIDATION_FAILED"
  | "ERR_PROCESS_MISMATCH";

export type FieldError = {
  code: FieldErrorCode;
  message: string;
};

export type FieldErrors = Record<string, FieldError>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;
const PHONE_PATTERN = /^\+?[\d\s().-]{6,30}$/;
const DANGEROUS_CHARS = /[<>{}]/;

function required(field: string): FieldError {
  return { code: "MSG002", message: `Trường ${field} là bắt buộc.` };
}

function invalid(field: string, hint: string): FieldError {
  return { code: "ERR_VALIDATION_FAILED", message: `${field} ${hint}` };
}

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function checkLength(
  errors: FieldErrors,
  key: string,
  field: string,
  value: unknown,
  min: number,
  max: number,
) {
  const text = trimmed(value);
  if (!text) {
    errors[key] = required(field);
    return;
  }
  if (text.length < min || text.length > max) {
    errors[key] = invalid(field, `phải có độ dài ${min}–${max} ký tự.`);
  }
}

function checkOptionalLength(
  errors: FieldErrors,
  key: string,
  field: string,
  value: unknown,
  max: number,
) {
  const text = trimmed(value);
  if (text.length > max) {
    errors[key] = invalid(field, `không được vượt quá ${max} ký tự.`);
  }
}

function checkEnum<T extends string>(
  errors: FieldErrors,
  key: string,
  field: string,
  value: unknown,
  allowed: readonly T[],
) {
  if (!allowed.includes(value as T)) {
    errors[key] = invalid(field, "không hợp lệ.");
  }
}

function checkNumberRange(
  errors: FieldErrors,
  key: string,
  field: string,
  value: unknown,
  min: number,
  max: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors[key] = invalid(field, "phải là số hợp lệ.");
    return;
  }
  if (value < min || value > max) {
    errors[key] = invalid(field, `phải nằm trong khoảng ${min}–${max}.`);
  }
}

function checkIntegerRange(
  errors: FieldErrors,
  key: string,
  field: string,
  value: unknown,
  min: number,
  max: number,
) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    errors[key] = invalid(field, "phải là số nguyên.");
    return;
  }
  if (value < min || value > max) {
    errors[key] = invalid(field, `phải nằm trong khoảng ${min}–${max}.`);
  }
}

export function validateFilmStock(input: FilmStockInput): FieldErrors {
  const errors: FieldErrors = {};

  const brand = trimmed(input.brand);
  checkLength(errors, "brand", "Tên hãng phim", input.brand, 2, 100);
  if (!errors.brand && DANGEROUS_CHARS.test(brand)) {
    errors.brand = invalid(
      "Tên hãng phim",
      "không được chứa ký tự <, >, {, }.",
    );
  }

  checkLength(errors, "name", "Tên dòng phim", input.name, 2, 150);
  checkIntegerRange(
    errors,
    "nominal_iso",
    "ISO danh định",
    input.nominal_iso,
    6,
    12800,
  );
  checkEnum(
    errors,
    "process",
    "Quy trình tráng",
    input.process,
    FILM_PROCESSES,
  );
  checkEnum(errors, "color_type", "Loại phim", input.color_type, COLOR_TYPES);

  if (Array.isArray(input.supported_formats)) {
    if (input.supported_formats.length === 0) {
      errors.supported_formats = required("Khổ phim hỗ trợ");
    } else if (
      input.supported_formats.some((format) => !FILM_FORMATS.includes(format))
    ) {
      errors.supported_formats = invalid("Khổ phim hỗ trợ", "không hợp lệ.");
    }
  } else {
    errors.supported_formats = required("Khổ phim hỗ trợ");
  }

  checkOptionalLength(errors, "description", "Mô tả", input.description, 2000);

  // BR: ràng buộc chéo process ↔ color_type (mục 2.2 của Module 02).
  if (!errors.process && !errors.color_type) {
    if (
      input.process === "ECN-2" &&
      input.color_type !== "MOTION_PICTURE_COLOR"
    ) {
      errors.color_type = {
        code: "ERR_PROCESS_MISMATCH",
        message:
          "Quy trình ECN-2 chỉ áp dụng cho phim điện ảnh màu (MOTION_PICTURE_COLOR).",
      };
    }
    if (input.process === "B&W" && input.color_type !== "BLACK_AND_WHITE") {
      errors.color_type = {
        code: "ERR_PROCESS_MISMATCH",
        message:
          "Quy trình B&W chỉ áp dụng cho phim đen trắng (BLACK_AND_WHITE).",
      };
    }
  }

  return errors;
}

export function validateCamera(input: CameraInput): FieldErrors {
  const errors: FieldErrors = {};

  checkLength(errors, "brand", "Thương hiệu máy ảnh", input.brand, 2, 100);
  checkLength(errors, "model", "Model máy ảnh", input.model, 2, 150);
  checkEnum(
    errors,
    "camera_type",
    "Cơ chế ngắm/chụp",
    input.camera_type,
    CAMERA_TYPES,
  );
  checkEnum(
    errors,
    "supported_format",
    "Khổ phim",
    input.supported_format,
    FILM_FORMATS,
  );
  checkEnum(
    errors,
    "shutter_mechanism",
    "Cơ chế màn trập",
    input.shutter_mechanism,
    SHUTTER_MECHANISMS,
  );

  if (input.has_fixed_lens) {
    if (trimmed(input.default_lens_mount) !== "Fixed") {
      errors.default_lens_mount = {
        code: "ERR_VALIDATION_FAILED",
        message: "Máy ảnh dùng ống kính liền phải có ngàm mặc định là “Fixed”.",
      };
    }
    const specs = trimmed(input.fixed_lens_specs);
    if (specs.length < 5) {
      errors.fixed_lens_specs = {
        code: "MSG002",
        message:
          "Trường Thông số ống kính liền là bắt buộc (tối thiểu 5 ký tự).",
      };
    } else if (specs.length > 150) {
      errors.fixed_lens_specs = invalid(
        "Thông số ống kính liền",
        "tối đa 150 ký tự.",
      );
    }
  } else {
    checkOptionalLength(
      errors,
      "default_lens_mount",
      "Ngàm ống kính mặc định",
      input.default_lens_mount,
      50,
    );
    checkOptionalLength(
      errors,
      "fixed_lens_specs",
      "Thông số ống kính liền",
      input.fixed_lens_specs,
      150,
    );
  }

  const maxYear = new Date().getFullYear() + 1;
  const start = input.production_start_year;
  const end = input.production_end_year;

  if (start !== null && start !== undefined) {
    checkIntegerRange(
      errors,
      "production_start_year",
      "Năm bắt đầu sản xuất",
      start,
      1850,
      maxYear,
    );
  }
  if (end !== null && end !== undefined) {
    checkIntegerRange(
      errors,
      "production_end_year",
      "Năm ngừng sản xuất",
      end,
      1850,
      maxYear,
    );
  }
  if (
    !errors.production_start_year &&
    !errors.production_end_year &&
    typeof start === "number" &&
    typeof end === "number" &&
    start > end
  ) {
    errors.production_end_year = {
      code: "ERR_VALIDATION_FAILED",
      message: "Năm ngừng sản xuất phải lớn hơn hoặc bằng năm bắt đầu.",
    };
  }

  return errors;
}

export function validateLens(input: LensInput): FieldErrors {
  const errors: FieldErrors = {};

  checkLength(errors, "brand", "Thương hiệu ống kính", input.brand, 2, 100);
  checkLength(errors, "model", "Model ống kính", input.model, 2, 150);
  checkLength(errors, "mount_type", "Loại ngàm", input.mount_type, 1, 50);
  checkNumberRange(
    errors,
    "focal_length_min_mm",
    "Tiêu cự nhỏ nhất",
    input.focal_length_min_mm,
    4,
    2000,
  );
  checkNumberRange(
    errors,
    "max_aperture",
    "Khẩu độ tối đa",
    input.max_aperture,
    0.7,
    32,
  );

  if (input.is_prime) {
    const max = input.focal_length_max_mm;
    if (max !== null && max !== undefined) {
      if (typeof max !== "number" || max !== input.focal_length_min_mm) {
        errors.focal_length_max_mm = {
          code: "ERR_VALIDATION_FAILED",
          message:
            "Ống kính Prime phải để trống tiêu cự lớn nhất hoặc bằng tiêu cự nhỏ nhất.",
        };
      }
    }
  } else {
    checkNumberRange(
      errors,
      "focal_length_max_mm",
      "Tiêu cự lớn nhất",
      input.focal_length_max_mm,
      4,
      2000,
    );
    if (
      !errors.focal_length_max_mm &&
      typeof input.focal_length_max_mm === "number" &&
      typeof input.focal_length_min_mm === "number" &&
      input.focal_length_max_mm <= input.focal_length_min_mm
    ) {
      errors.focal_length_max_mm = {
        code: "ERR_VALIDATION_FAILED",
        message:
          "Ống kính Zoom phải có tiêu cự lớn nhất lớn hơn tiêu cự nhỏ nhất.",
      };
    }
  }

  const minAperture = input.min_aperture;
  if (minAperture !== null && minAperture !== undefined) {
    checkNumberRange(
      errors,
      "min_aperture",
      "Khẩu độ khép nhỏ nhất",
      minAperture,
      0.7,
      64,
    );
    if (
      !errors.min_aperture &&
      typeof minAperture === "number" &&
      typeof input.max_aperture === "number" &&
      minAperture <= input.max_aperture
    ) {
      errors.min_aperture = {
        code: "ERR_VALIDATION_FAILED",
        message: "Khẩu độ khép nhỏ nhất phải lớn hơn khẩu độ tối đa.",
      };
    }
  }

  if (Array.isArray(input.format_coverage)) {
    if (input.format_coverage.length === 0) {
      errors.format_coverage = required("Độ phủ định dạng");
    } else if (
      input.format_coverage.some((format) => !FILM_FORMATS.includes(format))
    ) {
      errors.format_coverage = invalid("Độ phủ định dạng", "không hợp lệ.");
    }
  } else {
    errors.format_coverage = required("Độ phủ định dạng");
  }

  return errors;
}

export function validateFilmLab(input: FilmLabInput): FieldErrors {
  const errors: FieldErrors = {};

  checkLength(errors, "name", "Tên phòng Lab", input.name, 2, 150);
  checkLength(errors, "city", "Thành phố", input.city, 2, 100);

  const country = trimmed(input.country_code).toUpperCase();
  if (!country) {
    errors.country_code = required("Mã quốc gia");
  } else if (!/^[A-Z]{2}$/.test(country)) {
    errors.country_code = invalid(
      "Mã quốc gia",
      "phải là 2 chữ cái viết hoa theo ISO 3166-1 alpha-2 (VD: VN).",
    );
  }

  checkOptionalLength(errors, "address", "Địa chỉ", input.address, 500);
  checkOptionalLength(errors, "website_url", "Website", input.website_url, 255);
  checkOptionalLength(errors, "email", "Email", input.email, 150);
  checkOptionalLength(errors, "phone", "Số điện thoại", input.phone, 30);

  const website = trimmed(input.website_url);
  if (website && !URL_PATTERN.test(website)) {
    errors.website_url = invalid(
      "Website",
      "phải bắt đầu bằng http:// hoặc https://.",
    );
  }

  const email = trimmed(input.email);
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = invalid("Email", "không đúng định dạng.");
  }

  const phone = trimmed(input.phone);
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = invalid("Số điện thoại", "không đúng định dạng.");
  }

  if (Array.isArray(input.supported_processes)) {
    if (input.supported_processes.length === 0) {
      errors.supported_processes = required("Quy trình tráng hỗ trợ");
    } else if (
      input.supported_processes.some(
        (process) => !FILM_PROCESSES.includes(process),
      )
    ) {
      errors.supported_processes = invalid(
        "Quy trình tráng hỗ trợ",
        "không hợp lệ.",
      );
    }
  } else {
    errors.supported_processes = required("Quy trình tráng hỗ trợ");
  }

  if (Array.isArray(input.scanners)) {
    if (input.scanners.length === 0) {
      errors.scanners = required("Máy quét hỗ trợ");
    } else if (input.scanners.some((scanner) => !SCANNERS.includes(scanner))) {
      errors.scanners = invalid("Máy quét hỗ trợ", "không hợp lệ.");
    }
  } else {
    errors.scanners = required("Máy quét hỗ trợ");
  }

  return errors;
}

export function validateMasterData(
  entity: MasterDataEntity,
  input: MasterDataInput,
): FieldErrors {
  switch (entity) {
    case "film-stocks":
      return validateFilmStock(input as FilmStockInput);
    case "cameras":
      return validateCamera(input as CameraInput);
    case "lenses":
      return validateLens(input as LensInput);
    case "film-labs":
      return validateFilmLab(input as FilmLabInput);
  }
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
