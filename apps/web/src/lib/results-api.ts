import { http } from "@/lib/http/client";
import type {
  ContestResults,
  MyContestResultsResponse,
  PublishResultsInput,
  PublishResultsResponse,
  ScoreboardApiResponse,
  SubmissionFeedbackResponse,
} from "@/types/results";

const MSG005 =
  "MSG005: Bạn không có quyền thực hiện thao tác này. / Access denied.";
const MSG024 =
  "MSG024: Chưa thể khóa vòng chấm vì còn đánh giá bắt buộc chưa được xác nhận.";

type ApiError = {
  code?: string;
  name?: string;
  message?: string;
  response?: {
    status?: number;
    data?: unknown;
  };
};

export function unwrap<T>(response: { data: T }): T {
  return response.data;
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

function asApiError(error: unknown): ApiError {
  return (error ?? {}) as ApiError;
}

export function isAbortError(error: unknown): boolean {
  const apiError = asApiError(error);
  return (
    apiError.code === "ERR_CANCELED" ||
    apiError.name === "AbortError" ||
    apiError.name === "CanceledError"
  );
}

export function getResultsErrorMessage(
  error: unknown,
  submissionCode?: string,
): string {
  const apiError = asApiError(error);
  const status = apiError.response?.status;
  const apiMessage =
    extractApiMessage(apiError.response?.data) || apiError.message || "";
  const normalized = apiMessage.toLowerCase();

  if (status === 403) return MSG005;

  if (status === 409) {
    if (normalized.includes("proof")) {
      const code = submissionCode?.trim() || "?";
      return `Không thể công bố: Tác phẩm ${code} còn thiếu xác minh bằng chứng theo thể lệ.`;
    }
    if (normalized.includes("locked") || normalized.includes("scorecard")) {
      return MSG024;
    }
    if (normalized.includes("br-25") || normalized.includes("tie")) {
      return "BR-25: Cần xác nhận từng nhóm đồng điểm kèm lý do.";
    }
  }

  if (
    status === 400 &&
    (normalized.includes("tie") || normalized.includes("submission id"))
  ) {
    return "Nhóm đồng điểm không khớp dữ liệu thực tế.";
  }

  return apiMessage || "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}

export async function getScoreboard(
  contestId: string,
  signal?: AbortSignal,
): Promise<ScoreboardApiResponse> {
  return unwrap(
    await http.get<ScoreboardApiResponse>(
      `/api/v1/contests/${encodeURIComponent(contestId)}/scoreboard`,
      { signal },
    ),
  );
}

export async function publishResults(
  contestId: string,
  input: PublishResultsInput,
): Promise<PublishResultsResponse> {
  return unwrap(
    await http.post<PublishResultsResponse>(
      `/api/v1/contests/${encodeURIComponent(contestId)}/publish-results`,
      input,
    ),
  );
}

export async function getContestResults(
  contestId: string,
): Promise<ContestResults> {
  const response = await http.get<
    ContestResults & { data?: ContestResults }
  >(`/api/v1/contests/${encodeURIComponent(contestId)}/results`);
  return response.data.data ?? response.data;
}

export async function getSubmissionFeedback(
  submissionId: string,
  signal?: AbortSignal,
): Promise<SubmissionFeedbackResponse> {
  return unwrap(
    await http.get<SubmissionFeedbackResponse>(
      `/api/v1/submissions/${encodeURIComponent(submissionId)}/feedback`,
      { signal },
    ),
  );
}

export async function getMyResults(
  contestId: string,
): Promise<MyContestResultsResponse> {
  return unwrap(
    await http.get<MyContestResultsResponse>(
      `/api/v1/contests/${encodeURIComponent(contestId)}/my-results`,
    ),
  );
}
