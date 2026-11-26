import axios from "axios";

import { http } from "@/lib/http";
import type {
  AiComparisonData,
  AiThresholds,
  BatchAiScanResult,
  SingleAiScanResult,
} from "@/types/ai";

const AI_ENDPOINT = "/api/v1/ai";
const SUBMISSIONS_ENDPOINT = "/api/v1/submissions";

type AiErrorBody = {
  message?: string;
  error?: { message?: string } | string;
};

export function unwrap<T>(data: unknown): T {
  const root = data as { data?: T } | null | undefined;
  return (root?.data ?? data) as T;
}

function isReadableMessage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !/^[A-Z0-9_:-]+$/.test(value.trim())
  );
}

export function getAiErrorMessage(error: unknown): string {
  const generic = "Không thể thực hiện yêu cầu AI. Vui lòng thử lại.";

  if (!axios.isAxiosError<AiErrorBody>(error)) {
    return error instanceof Error && isReadableMessage(error.message)
      ? error.message
      : generic;
  }

  if (!error.response) {
    return "Không thể kết nối máy chủ AI. Vui lòng kiểm tra đường truyền và thử lại.";
  }

  const body = error.response.data;
  const errorField = body?.error;
  const apiMessage =
    typeof errorField === "object"
      ? errorField?.message
      : isReadableMessage(errorField)
        ? errorField
        : body?.message;
  const readable = isReadableMessage(apiMessage) ? apiMessage.trim() : null;
  const status = error.response.status;

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }
  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này. / Access denied.";
  }
  if (status === 404) {
    return "Không tìm thấy bài dự thi hoặc API AI chưa được triển khai.";
  }
  if (status === 400 || status === 422) {
    return readable ?? "Dữ liệu AI không hợp lệ. Vui lòng kiểm tra lại.";
  }
  if (status >= 500) {
    return "Hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.";
  }
  return readable ?? generic;
}

export async function getAiThresholds(): Promise<AiThresholds> {
  const response = await http.get(`${AI_ENDPOINT}/thresholds`);
  return unwrap<AiThresholds>(response.data);
}

export async function updateAiThresholds(
  payload: Partial<AiThresholds>,
): Promise<AiThresholds> {
  const response = await http.put(`${AI_ENDPOINT}/thresholds`, payload);
  return unwrap<AiThresholds>(response.data);
}

export async function triggerSingleAiScan(
  submissionId: string,
): Promise<SingleAiScanResult> {
  const response = await http.post(
    `${AI_ENDPOINT}/scan/${encodeURIComponent(submissionId)}`,
  );
  return unwrap<SingleAiScanResult>(response.data);
}

export async function triggerBatchAiScan(payload: {
  contestId: string;
  submissionIds?: string[];
}): Promise<BatchAiScanResult> {
  const response = await http.post(`${AI_ENDPOINT}/scan/batch`, payload);
  return unwrap<BatchAiScanResult>(response.data);
}

export async function getAiComparison(
  submissionId: string,
): Promise<AiComparisonData | null> {
  const response = await http.get(
    `${SUBMISSIONS_ENDPOINT}/${encodeURIComponent(submissionId)}/comparison`,
  );
  return unwrap<AiComparisonData | null>(response.data) ?? null;
}
