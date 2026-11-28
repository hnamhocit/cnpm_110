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
  const response = await http.get<unknown>(
    `/api/v1/contests/${contestId}/categories/${categoryId}/criteria`,
  );
  const payload = unwrap<unknown>(response.data);
  return asArray(payload, "criteria").map((item) => {
    const record = item as Record<string, unknown>;
    return {
      code: String(record.code ?? record.id ?? record.name ?? ""),
      name: String(record.name ?? ""),
      weight: Number(record.weight),
      maxScore:
        record.maxScore != null ? Number(record.maxScore) : undefined,
    };
  });
}

type RoundInput = {
  name: string;
  order: number;
  advanceCount?: number | null;
};

function contestBody(payload: ContestConfigInput, includeCategories = false) {
  const rounds = (payload as ContestConfigInput & { rounds?: RoundInput[] })
    .rounds;

  return {
    name: payload.name,
    description: composeDescription(payload.theme, payload.rules),
    registrationStartAt: toIso(payload.registrationStartAt),
    submissionDeadlineAt: toIso(payload.submissionDeadlineAt),
    judgingStartAt: toIso(payload.judgingStartAt),
    judgingDeadlineAt: toIso(payload.judgingDeadlineAt),
    publishedAt: toIso(payload.publishedAt),
    theme: payload.theme,
    rules: payload.rules,
    ...(payload.coverImageUrl
      ? { coverImageUrl: payload.coverImageUrl }
      : {}),
    rounds:
      rounds?.map((round) => ({
        name: round.name,
        order: round.order,
        advanceCount: round.advanceCount ?? null,
      })) ?? [{ name: "Vòng chung kết", order: 1, advanceCount: null }],
    awards: payload.awards.map((award) => ({
      code: award.code,
      name: award.name,
      rankOrder: award.rankOrder,
      prizeValueVnd: award.prizeValueVnd,
      quota: award.quota,
    })),
    ...(includeCategories
      ? {
          categories: payload.categories.map((category) => ({
            name: category.name,
            ...(category.description
              ? { description: category.description }
              : {}),
            isActive: category.isActive ?? true,
            requireNegativeProof: Boolean(
              category.requireNegativeProofUpfront,
            ),
            criteria: (category.criteria ?? []).map((criterion) => ({
              name: criterion.name,
              weight: Number(criterion.weight),
              maxScore: Number(criterion.maxScore ?? 10),
            })),
          })),
        }
      : {}),
    status: payload.status,
  };
}

export async function createContestConfig(
  payload: ContestConfigInput,
): Promise<ContestConfigRecord> {
  const response = await http.post<unknown>(
    "/api/v1/contests",
    contestBody(payload, true),
  );
  return unwrap<ContestConfigRecord>(response.data);
}

export async function updateContestConfig(
  id: string,
  payload: ContestConfigInput,
): Promise<ContestConfigRecord> {
  const response = await http.put<unknown>(
    `/api/v1/contests/${id}`,
    contestBody(payload, false),
  );
  return unwrap<ContestConfigRecord>(response.data);
}

export async function duplicateContestConfig(
  sourceId: string,
  payload: ContestConfigInput,
): Promise<ContestConfigRecord> {
  const response = await http.post<unknown>(
    `/api/v1/contests/${sourceId}/duplicate`,
    {
      name: payload.name,
      registrationStartAt: toIso(payload.registrationStartAt),
      submissionDeadlineAt: toIso(payload.submissionDeadlineAt),
      judgingStartAt: toIso(payload.judgingStartAt),
      judgingDeadlineAt: toIso(payload.judgingDeadlineAt),
      publishedAt: toIso(payload.publishedAt),
    },
  );
  return unwrap<ContestConfigRecord>(response.data);
}

export async function saveCategory(
  contestId: string,
  category: CategoryConfig | null,
  categoryId?: string,
): Promise<CategoryRecord> {
  const description = category?.description;
  const body = category
    ? {
        name: category.name,
        ...(description ? { description } : {}),
        ...(category.isActive !== undefined
          ? { isActive: category.isActive }
          : {}),
        requireNegativeProof: Boolean(category.requireNegativeProofUpfront),
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

export async function deleteCategory(
  contestId: string,
  categoryId: string,
): Promise<void> {
  await http.delete(
    `/api/v1/contests/${contestId}/categories/${categoryId}`,
  );
}

export async function saveCriteria(
  contestId: string,
  categoryId: string,
  criteria: CriterionConfig[],
): Promise<void> {
  await http.put(
    `/api/v1/contests/${contestId}/categories/${categoryId}/criteria`,
    {
      criteria: criteria.map((criterion) => ({
        name: criterion.name,
        weight: Number(criterion.weight),
        ...(criterion.maxScore != null
          ? { maxScore: Number(criterion.maxScore) }
          : {}),
      })),
    },
  );
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
      code: "NOT_FOUND",
      message: safeMessage(data.message, "Không tìm thấy tài nguyên."),
      contractGap: null,
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
