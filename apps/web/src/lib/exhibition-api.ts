import { http } from "@/lib/http/client";
import type { ArchiveArtwork } from "@/types/archive";
import type {
  ArchiveContestInput,
  ArchiveContestResponse,
  ContestExhibitionItem,
  ExhibitionActionResponse,
  ExhibitionListResponse,
  ExhibitionQueryFilters,
  ExhibitionStatusUpdate,
  ProcessExhibitionInput,
  PublicExhibitionDetail,
  PublicExhibitionItem,
} from "@/types/exhibition";

const MSG005 =
  "MSG005: Bạn không có quyền thực hiện thao tác này. / Access denied.";
const MSG026 = (submissionCode = "?") =>
  `MSG026: Không thể công bố: Tác phẩm ${submissionCode} còn thiếu xác minh bằng chứng theo thể lệ.`;

type ApiError = {
  code?: string;
  name?: string;
  message?: string;
  response?: {
    status?: number;
    data?: unknown;
  };
};

type ArchiveFilmFormat = ArchiveArtwork["film_format"];

export function unwrap<T>(response: { data: T }): T {
  return response.data;
}

function asApiError(error: unknown): ApiError {
  return (error ?? {}) as ApiError;
}

function extractApiMessage(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") {
    const candidate = payload as { message?: unknown; error?: unknown };
    if (typeof candidate.message === "string") return candidate.message;
    if (typeof candidate.error === "string") return candidate.error;
  }
  return "";
}

export function isAbortError(error: unknown): boolean {
  const apiError = asApiError(error);
  return (
    apiError.code === "ERR_CANCELED" ||
    apiError.name === "AbortError" ||
    apiError.name === "CanceledError"
  );
}

export function getExhibitionErrorMessage(
  error: unknown,
  submissionCode?: string,
): string {
  const apiError = asApiError(error);
  const status = apiError.response?.status;
  const apiMessage =
    extractApiMessage(apiError.response?.data) || apiError.message || "";
  const normalized = `${apiError.code ?? ""} ${apiMessage}`.toLowerCase();

  if (status === 403) return MSG005;

  if (status === 409 && normalized.includes("proof")) {
    return MSG026(submissionCode?.trim() || "?");
  }

  if (status === 404) {
    return "Không tìm thấy tác phẩm triển lãm.";
  }

  if (status === 400) {
    return apiMessage || "Yêu cầu không hợp lệ (validation).";
  }

  return apiMessage || "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}

export function buildProcessExhibitionInput(
  input: ProcessExhibitionInput = {},
): Required<ProcessExhibitionInput> {
  return {
    generateWebp: true,
    applyWatermark: true,
    publish: input.publish === true,
  };
}

export function buildArchiveContestInput(input: ArchiveContestInput = {}) {
  const built: ArchiveContestInput & {
    generateWebp: true;
    applyWatermark: true;
    includeFinalists: boolean;
    publish: boolean;
  } = {
    generateWebp: true,
    applyWatermark: true,
    includeFinalists: input.includeFinalists !== false,
    publish: input.publish !== false,
  };

  if (input.submissionIds?.length) {
    built.submissionIds = [...input.submissionIds];
  }

  return built;
}

function normaliseText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "all") return undefined;
  return trimmed;
}

function normaliseOptionalPositiveInt(
  value: string | number | undefined,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = typeof value === "number" ? value : Number(value.trim());
  if (!Number.isInteger(parsed) || parsed < 1) return undefined;
  return parsed;
}

function normalisePositiveInt(
  value: string | number | undefined,
  fallback: number,
): number {
  return normaliseOptionalPositiveInt(value) ?? fallback;
}

const FILM_FORMAT_QUERY_VALUES: Record<string, string> = {
  "35mm": "135",
  "large format": "4x5",
};

function toExhibitionFilmFormat(value: string | undefined): string | undefined {
  const normalised = normaliseText(value);
  if (normalised === undefined) return undefined;
  return FILM_FORMAT_QUERY_VALUES[normalised.toLowerCase()] ?? normalised;
}

export function buildExhibitionQuery(
  filters: ExhibitionQueryFilters = {},
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: normalisePositiveInt(filters.page, 1),
    limit: normalisePositiveInt(filters.limit, 20),
  };

  const year = normaliseOptionalPositiveInt(filters.year);
  if (year !== undefined) query.year = year;

  const textFilters: Record<string, string | undefined> = {
    contestId: filters.contestId,
    filmStock: filters.filmStock,
    camera: filters.camera,
    filmFormat: toExhibitionFilmFormat(filters.filmFormat),
    aiTag: filters.aiTag,
    award: filters.award,
  };

  for (const [key, value] of Object.entries(textFilters)) {
    const normalised = normaliseText(value);
    if (normalised !== undefined) query[key] = normalised;
  }

  return query;
}

function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(
    /\/+$/,
    "",
  );
}

export function resolveExhibitionImageUrl(
  imageUrl: string | null | undefined,
  exhibitionId: string,
): string {
  const baseUrl = apiBaseUrl();
  const fallback = `${baseUrl}/api/v1/exhibitions/${encodeURIComponent(exhibitionId)}/image`;
  const trimmed = imageUrl?.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `${baseUrl}/${trimmed.replace(/^\/+/, "")}`;
}

export function toArchiveFilmFormat(
  value: string | null | undefined,
): ArchiveFilmFormat {
  const normalized = value?.trim().toLowerCase();
  switch (normalized) {
    case "35mm":
    case "135":
      return "35mm";
    case "120":
    case "medium":
    case "medium format":
      return "120";
    case "4x5":
    case "large":
    case "large format":
      return "Large Format";
    default:
      return "35mm";
  }
}

export function toArchiveArtwork(item: PublicExhibitionItem): ArchiveArtwork {
  return {
    id: item.id,
    title: item.title,
    author_name: item.author?.trim() || "Đang cập nhật",
    contest_id: item.contestId,
    contest_name: item.contestName?.trim() || "Cuộc thi",
    year: item.year ?? new Date().getFullYear(),
    category: item.categoryName?.trim() || "Hạng mục",
    award: item.awardTitle?.trim() || undefined,
    image_url: resolveExhibitionImageUrl(item.imageUrl, item.id),
    film_stock: item.filmStock?.trim() || "Đang cập nhật",
    film_format: toArchiveFilmFormat(item.filmFormat),
    camera: item.camera?.trim() || undefined,
    copyright: item.copyright ?? undefined,
    awardTitle: item.awardTitle?.trim() || undefined,
    watermarked: item.watermarked,
  };
}

export function mergeArchiveArtworkDetail(
  fallback: ArchiveArtwork,
  detail: PublicExhibitionDetail,
): ArchiveArtwork {
  const labScan = [detail.lab, detail.scannerModel]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" - ");

  return {
    ...fallback,
    iso: detail.iso ?? fallback.iso,
    lens: detail.lens?.trim() || fallback.lens,
    lab_scan: labScan || fallback.lab_scan,
    description: detail.description?.trim() || fallback.description,
    camera: detail.camera?.trim() || fallback.camera,
  };
}

function exhibitionPath(exhibitionId: string): string {
  return `/api/v1/exhibitions/${encodeURIComponent(exhibitionId)}`;
}

export async function archiveContest(
  contestId: string,
  input: ArchiveContestInput = {},
): Promise<ArchiveContestResponse> {
  return unwrap(
    await http.post<ArchiveContestResponse>(
      `/api/v1/contests/${encodeURIComponent(contestId)}/archive`,
      buildArchiveContestInput(input),
    ),
  );
}

export async function getContestExhibitions(
  contestId: string,
  signal?: AbortSignal,
): Promise<ContestExhibitionItem[]> {
  return unwrap(
    await http.get<ContestExhibitionItem[]>(
      `/api/v1/contests/${encodeURIComponent(contestId)}/exhibitions`,
      { signal },
    ),
  );
}

export async function getExhibitions(
  filters: ExhibitionQueryFilters = {},
  signal?: AbortSignal,
): Promise<ExhibitionListResponse> {
  return unwrap(
    await http.get<ExhibitionListResponse>("/api/v1/exhibitions", {
      params: buildExhibitionQuery(filters),
      signal,
    }),
  );
}

export async function getExhibition(
  exhibitionId: string,
  signal?: AbortSignal,
): Promise<PublicExhibitionDetail> {
  return unwrap(
    await http.get<PublicExhibitionDetail>(exhibitionPath(exhibitionId), {
      signal,
    }),
  );
}

export function getExhibitionImageUrl(
  imageUrl: string | null | undefined,
  exhibitionId: string,
): string {
  return resolveExhibitionImageUrl(imageUrl, exhibitionId);
}

export async function processExhibition(
  exhibitionId: string,
  input: ProcessExhibitionInput = {},
): Promise<ExhibitionActionResponse> {
  return unwrap(
    await http.post<ExhibitionActionResponse>(
      `${exhibitionPath(exhibitionId)}/process`,
      buildProcessExhibitionInput(input),
    ),
  );
}

export async function getExhibitionStatus(
  exhibitionId: string,
  signal?: AbortSignal,
): Promise<ExhibitionActionResponse> {
  return unwrap(
    await http.get<ExhibitionActionResponse>(
      `${exhibitionPath(exhibitionId)}/status`,
      { signal },
    ),
  );
}

export async function updateExhibitionStatus(
  exhibitionId: string,
  input: ExhibitionStatusUpdate,
): Promise<ExhibitionActionResponse> {
  return unwrap(
    await http.patch<ExhibitionActionResponse>(exhibitionPath(exhibitionId), {
      status: input.status,
    }),
  );
}

export async function deleteExhibition(
  exhibitionId: string,
): Promise<ExhibitionActionResponse> {
  return unwrap(
    await http.delete<ExhibitionActionResponse>(exhibitionPath(exhibitionId)),
  );
}
