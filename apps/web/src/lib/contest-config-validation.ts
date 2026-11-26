import {
  CONTEST_STATUSES,
  type ContestConfigInput,
  type CriterionConfig,
  fromPercent,
  isFormatRestriction,
  toPercent,
} from "@/types/contest-config";

export type ConfigValidationError = { code: string; message: string };

export const MSG002_REQUIRED = (field: string) =>
  `Trường ${field} là bắt buộc.`;

export const MSG007_INVALID_TOTAL = (current: number) =>
  `Tổng tỷ trọng các tiêu chí chấm điểm phải bằng đúng 100% (Hiện tại: ${current}%).`;

export const MSG008_INVALID_TIMELINE =
  "Thời hạn nộp bài phải diễn ra trước thời gian bắt đầu chấm thi. Thứ tự 5 mốc: đăng ký < nộp bài < bắt đầu chấm < kết thúc chấm < công bố.";

const TIMELINE_KEYS = [
  "registrationStartAt",
  "submissionDeadlineAt",
  "judgingStartAt",
  "judgingDeadlineAt",
  "publishedAt",
] as const;

function setError(
  errors: Record<string, ConfigValidationError>,
  field: string,
  code: string,
  message: string,
) {
  if (!errors[field]) errors[field] = { code, message };
}

function validateTimeline(
  input: ContestConfigInput,
  errors: Record<string, ConfigValidationError>,
) {
  const times = TIMELINE_KEYS.map((key) => Date.parse(input[key] ?? ""));

  TIMELINE_KEYS.forEach((key, index) => {
    if (!input[key]?.trim()) {
      setError(errors, key, "MSG002", MSG002_REQUIRED(key));
    } else if (Number.isNaN(times[index])) {
      setError(
        errors,
        key,
        "INVALID_DATE",
        `Mốc thời gian ${key} không hợp lệ.`,
      );
    }
  });

  for (let index = 0; index < times.length - 1; index += 1) {
    if (Number.isNaN(times[index]) || Number.isNaN(times[index + 1])) continue;
    if (times[index] >= times[index + 1]) {
      const field = index <= 1 ? "submissionDeadlineAt" : "judgingStartAt";
      setError(errors, field, "MSG008", MSG008_INVALID_TIMELINE);
      break;
    }
  }
}

function validateCriteria(
  criteria: CriterionConfig[] | undefined,
  field: string,
  errors: Record<string, ConfigValidationError>,
) {
  if (!criteria?.length) {
    setError(
      errors,
      field,
      "MSG002",
      "Mỗi hạng mục phải có ít nhất một tiêu chí chấm điểm.",
    );
    return;
  }

  let sum = 0;
  criteria.forEach((criterion, index) => {
    const name = criterion?.name?.trim() ?? "";
    if (name.length < 2) {
      setError(
        errors,
        `${field}.${index}.name`,
        "MSG002",
        "Tên tiêu chí phải có ít nhất 2 ký tự.",
      );
    }

    const weight = Number(criterion?.weight);
    if (!Number.isFinite(weight) || weight < 0.01 || weight > 1) {
      setError(
        errors,
        `${field}.${index}.weight`,
        "INVALID_WEIGHT",
        "Trọng số tiêu chí phải nằm trong khoảng 0.01 đến 1 (1% đến 100%).",
      );
      return;
    }
    sum += weight;
  });

  if (Math.abs(sum - 1) >= 0.0001) {
    setError(errors, field, "MSG007", MSG007_INVALID_TOTAL(toPercent(sum)));
  }
}

export function validateContestConfig(
  input: ContestConfigInput,
): Record<string, ConfigValidationError> {
  const errors: Record<string, ConfigValidationError> = {};

  const name = input?.name?.trim() ?? "";
  if (name.length < 5 || name.length > 150) {
    setError(
      errors,
      "name",
      "MSG002",
      "Tên cuộc thi phải có từ 5 đến 150 ký tự.",
    );
  }

  if (input?.slug?.trim() && !/^[a-z0-9-]+$/.test(input.slug.trim())) {
    setError(
      errors,
      "slug",
      "INVALID_SLUG",
      "Slug chỉ được chứa chữ thường, số và dấu gạch ngang.",
    );
  }

  if (!input?.theme?.trim()) {
    setError(errors, "theme", "MSG002", MSG002_REQUIRED("Chủ đề (theme)"));
  }
  if (!input?.rules?.trim()) {
    setError(errors, "rules", "MSG002", MSG002_REQUIRED("Thể lệ (rules)"));
  }

  validateTimeline(input, errors);

  const maxEntries = Number(input?.maxEntriesPerUser);
  if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 10) {
    setError(
      errors,
      "maxEntriesPerUser",
      "INVALID_RANGE",
      "Số bài tối đa mỗi thí sinh phải từ 1 đến 10.",
    );
  }

  if (!Array.isArray(input?.categories) || input.categories.length === 0) {
    setError(
      errors,
      "categories",
      "MSG002",
      "Cuộc thi phải có ít nhất một hạng mục.",
    );
  } else {
    input.categories.forEach((category, index) => {
      const prefix = `categories.${index}`;
      if (!category?.name?.trim() || category.name.trim().length < 3) {
        setError(
          errors,
          `${prefix}.name`,
          "MSG002",
          "Tên hạng mục phải có ít nhất 3 ký tự.",
        );
      }
      if (!isFormatRestriction(category?.formatRestriction)) {
        setError(
          errors,
          `${prefix}.formatRestriction`,
          "INVALID_ENUM",
          "Khổ phim phải là 135, 120, 4x5 hoặc ALL.",
        );
      }
      const categoryMax = Number(category?.maxEntriesPerParticipant);
      if (
        !Number.isInteger(categoryMax) ||
        categoryMax < 1 ||
        categoryMax > 10
      ) {
        setError(
          errors,
          `${prefix}.maxEntriesPerParticipant`,
          "INVALID_RANGE",
          "Số bài tối đa mỗi thí sinh trong hạng mục phải từ 1 đến 10.",
        );
      }
      validateCriteria(category?.criteria, `${prefix}.criteria`, errors);
    });
  }

  if (Array.isArray(input?.awards)) {
    input.awards.forEach((award, index) => {
      const prefix = `awards.${index}`;
      if (!award?.code?.trim()) {
        setError(
          errors,
          `${prefix}.code`,
          "MSG002",
          MSG002_REQUIRED("Mã giải"),
        );
      }
      if (!award?.name?.trim()) {
        setError(
          errors,
          `${prefix}.name`,
          "MSG002",
          MSG002_REQUIRED("Tên giải"),
        );
      }
      if (
        !Number.isFinite(Number(award?.rankOrder)) ||
        Number(award.rankOrder) < 1
      ) {
        setError(
          errors,
          `${prefix}.rankOrder`,
          "INVALID_RANGE",
          "Thứ hạng giải phải lớn hơn hoặc bằng 1.",
        );
      }
      if (
        !Number.isFinite(Number(award?.prizeValueVnd)) ||
        Number(award.prizeValueVnd) < 0
      ) {
        setError(
          errors,
          `${prefix}.prizeValueVnd`,
          "INVALID_RANGE",
          "Giá trị giải không được âm.",
        );
      }
      if (!Number.isFinite(Number(award?.quota)) || Number(award.quota) < 1) {
        setError(
          errors,
          `${prefix}.quota`,
          "INVALID_RANGE",
          "Số lượng giải phải lớn hơn hoặc bằng 1.",
        );
      }
    });
  }

  if (!CONTEST_STATUSES.includes(input?.status)) {
    setError(
      errors,
      "status",
      "INVALID_ENUM",
      "Trạng thái cuộc thi không hợp lệ.",
    );
  }

  return errors;
}

export function validateContestUpdateInput(
  input: ContestConfigInput,
): Record<string, ConfigValidationError> {
  const errors: Record<string, ConfigValidationError> = {};

  const name = input?.name?.trim() ?? "";
  if (name.length < 5 || name.length > 150) {
    setError(
      errors,
      "name",
      "MSG002",
      "Tên cuộc thi phải có từ 5 đến 150 ký tự.",
    );
  }

  if (!input?.theme?.trim()) {
    setError(errors, "theme", "MSG002", MSG002_REQUIRED("Chủ đề (theme)"));
  }
  if (!input?.rules?.trim()) {
    setError(errors, "rules", "MSG002", MSG002_REQUIRED("Thể lệ (rules)"));
  }

  if (!CONTEST_STATUSES.includes(input?.status)) {
    setError(
      errors,
      "status",
      "INVALID_ENUM",
      "Trạng thái cuộc thi không hợp lệ.",
    );
  }

  const startKey = "registrationStartAt" as const;
  const endKey = "publishedAt" as const;
  const startValue = input?.[startKey] ?? "";
  const endValue = input?.[endKey] ?? "";
  const startTime = Date.parse(startValue);
  const endTime = Date.parse(endValue);

  if (!startValue?.trim()) {
    setError(errors, startKey, "MSG002", MSG002_REQUIRED(startKey));
  } else if (Number.isNaN(startTime)) {
    setError(
      errors,
      startKey,
      "INVALID_DATE",
      `Mốc thời gian ${startKey} không hợp lệ.`,
    );
  }

  if (!endValue?.trim()) {
    setError(errors, endKey, "MSG002", MSG002_REQUIRED(endKey));
  } else if (Number.isNaN(endTime)) {
    setError(
      errors,
      endKey,
      "INVALID_DATE",
      `Mốc thời gian ${endKey} không hợp lệ.`,
    );
  }

  if (
    !Number.isNaN(startTime) &&
    !Number.isNaN(endTime) &&
    startTime >= endTime
  ) {
    setError(errors, endKey, "MSG008", MSG008_INVALID_TIMELINE);
  }

  return errors;
}

export function hasValidationErrors(
  errors: Record<string, ConfigValidationError>,
): boolean {
  return Object.keys(errors).length > 0;
}

export function criteriaErrorForTotal(
  total: number,
): ConfigValidationError | null {
  return Math.abs(total - 1) >= 0.0001
    ? { code: "MSG007", message: MSG007_INVALID_TOTAL(toPercent(total)) }
    : null;
}

export { fromPercent };
