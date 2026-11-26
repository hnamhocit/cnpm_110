import axios from "axios";

import {
  MSG007_INVALID_TOTAL,
  MSG008_INVALID_TIMELINE,
} from "@/lib/contest-config-validation";
import { http } from "@/lib/http";
import type {
  AwardConfig,
  CategoryConfig,
  CategoryRecord,
  ContestConfigInput,
  ContestConfigRecord,
  CriterionConfig,
} from "@/types/contest-config";

export type ContestConfigApiError = {
  code: string;
  message: string;
  contractGap: string | null;
};

export const CONTEST_CONFIG_GAP_MESSAGE =
  "API cấu hình cuộc thi chưa được triển khai đầy đủ (FPC-083).";

type ApiErrorBody = {
  code?: unknown;
  message?: unknown;
  error?: unknown;
};

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    if (data !== undefined && data !== null) return data as T;
  }
  return payload as T;
}

function asArray(payload: unknown, key?: string): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && key) {
    const nested = (payload as Record<string, unknown>)[key];
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

function toIso(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toISOString();
}

export function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function composeDescription(theme?: string, rules?: string): string {
  return [
    theme?.trim() ? `Chủ đề: ${theme.trim()}` : "",
    rules?.trim() ? `Thể lệ: ${rules.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function splitDescription(description?: string | null): {
  theme: string;
  rules: string;
} {
  const text = description ?? "";
  const themeMatch = text.match(/^Chủ đề:\s*([\s\S]*?)(?:\n\nThể lệ:|$)/);
  const rulesMatch = text.match(/Thể lệ:\s*([\s\S]*)$/);
  return {
    theme: themeMatch?.[1]?.trim() ?? "",
    rules: rulesMatch?.[1]?.trim() ?? text.trim(),
  };
}

export async function fetchContestConfig(
  id: string,
): Promise<ContestConfigRecord> {
  const response = await http.get<unknown>(`/api/v1/contests/${id}`);
  return unwrap<ContestConfigRecord>(response.data);
}

export async function fetchContestCategories(
  id: string,
): Promise<CategoryRecord[]> {
  const response = await http.get<unknown>(`/api/v1/contests/${id}/categories`);
  const payload = unwrap<unknown>(response.data);
  return asArray(payload, "items") as CategoryRecord[];
}

export async function fetchCriteria(
  contestId: string,
  categoryId: string,
): Promise<CriterionConfig[]> {
  // TODO(backend): GET criteria theo hạng mục là contract planned (FPC-083).
  const response = await http.get<unknown>(
    `/api/v1/contests/${contestId}/criteria`,
    {
      params: { categoryId },
    },
  );
  const payload = unwrap<unknown>(response.data);
  return asArray(payload, "criteria") as CriterionConfig[];
}

export async function createContestConfig(
  payload: ContestConfigInput,
): Promise<ContestConfigRecord> {
  // TODO(backend): POST mounted chỉ đọc name/description/startAt/endAt/status; các field Module 03 khác bị bỏ qua (FPC-083).
  const response = await http.post<unknown>("/api/v1/contests", {
    ...payload,
    registrationStartAt: toIso(payload.registrationStartAt),
    submissionDeadlineAt: toIso(payload.submissionDeadlineAt),
    judgingStartAt: toIso(payload.judgingStartAt),
    judgingDeadlineAt: toIso(payload.judgingDeadlineAt),
    publishedAt: toIso(payload.publishedAt),
  });
  return unwrap<ContestConfigRecord>(response.data);
}

export async function updateContestConfig(
  id: string,
  payload: ContestConfigInput,
): Promise<ContestConfigRecord> {
  // TODO(backend): PUT mounted chỉ lưu 5 field dưới đây. Slug/theme/rules/cover, 5 mốc BR-08,
  // maxEntriesPerUser, categories, criteria và awards chưa có route lưu (FPC-083).
  const response = await http.put<unknown>(`/api/v1/contests/${id}`, {
    name: payload.name.trim(),
    description: composeDescription(payload.theme, payload.rules),
    startAt: toIso(payload.registrationStartAt),
    endAt: toIso(payload.publishedAt),
    status: payload.status,
  });
  return unwrap<ContestConfigRecord>(response.data);
}

export async function saveCategory(
  contestId: string,
  category: CategoryConfig | null,
  categoryId?: string,
): Promise<CategoryRecord> {
  // TODO(backend): POST/PATCH categories là contract planned, chưa mount (FPC-083).
  const body = category
    ? {
        code: category.code,
        name: category.name,
        formatRestriction: category.formatRestriction,
        maxEntriesPerParticipant: category.maxEntriesPerParticipant,
        requireNegativeProofUpfront: category.requireNegativeProofUpfront,
        ...(category.isActive === undefined
          ? {}
          : { isActive: category.isActive }),
      }
    : {};

  const response = categoryId
    ? await http.patch<unknown>(
        `/api/v1/contests/${contestId}/categories/${categoryId}`,
        body,
      )
    : await http.post<unknown>(
        `/api/v1/contests/${contestId}/categories`,
        body,
      );
  return unwrap<CategoryRecord>(response.data);
}

export async function saveCriteria(
  contestId: string,
  categoryId: string,
  criteria: CriterionConfig[],
): Promise<void> {
  // Giữ endpoint cũ để tương thích với form hiện có; route vẫn là contract planned (FPC-083).
  await http.post(`/api/v1/contests/${contestId}/criteria`, {
    categoryId,
    criteria,
  });
}

function safeMessage(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const firstLine = value.split("\n")[0] ?? "";
  return (
    firstLine
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 300) || fallback
  );
}

export function toContestConfigError(error: unknown): ContestConfigApiError {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return {
      code: "REQUEST_FAILED",
      message: "Không thể hoàn tất thao tác. Vui lòng thử lại.",
      contractGap: null,
    };
  }

  const status = error.response?.status;
  const data = error.response?.data ?? {};
  const rawCode =
    typeof data.code === "string"
      ? data.code
      : typeof data.error === "string"
        ? data.error
        : "";
  const rawMessage = safeMessage(
    data.message,
    "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.",
  );
  const hint = `${rawCode} ${rawMessage}`.toLowerCase();

  if (status === 403) {
    return {
      code: "MSG005",
      message: "Bạn không có quyền thực hiện thao tác này.",
      contractGap: null,
    };
  }

  if (status === 404) {
    return {
      code: "FPC083_CONTRACT_GAP",
      message: CONTEST_CONFIG_GAP_MESSAGE,
      contractGap: CONTEST_CONFIG_GAP_MESSAGE,
    };
  }

  if (status === 500 || status === undefined) {
    return {
      code: "SERVER_ERROR",
      message: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
      contractGap: null,
    };
  }

  if (status === 400 || status === 422) {
    if (
      hint.includes("msg007") ||
      hint.includes("weight") ||
      hint.includes("tỷ trọng") ||
      hint.includes("trọng số")
    ) {
      return {
        code: "MSG007",
        message: rawMessage || MSG007_INVALID_TOTAL(0),
        contractGap: null,
      };
    }
    if (
      hint.includes("msg008") ||
      hint.includes("timeline") ||
      hint.includes("deadline") ||
      hint.includes("thời gian")
    ) {
      return {
        code: "MSG008",
        message: rawMessage || MSG008_INVALID_TIMELINE,
        contractGap: null,
      };
    }
  }

  return {
    code: rawCode || "REQUEST_FAILED",
    message: rawMessage,
    contractGap: null,
  };
}

export type { AwardConfig, CategoryConfig, CriterionConfig };
