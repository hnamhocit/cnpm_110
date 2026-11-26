import axios from "axios";

import { http } from "@/lib/http/client";
import type { SubmissionStatus } from "@/types/submission";

export type ModerationAction =
  | "APPROVE_FOR_JUDGING"
  | "DISQUALIFY"
  | "REQUEST_PROOF"
  | "OVERRIDE_AI_FLAG";

export type ProofRequestPayload = {
  reason: string;
  proofDeadlineAt: string;
};

export type ProofRequestResponse = {
  submissionId?: string;
  status?: SubmissionStatus;
  proofRequestedAt?: string | null;
  proofDeadlineAt?: string | null;
};

export class SubmissionModerationError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "SubmissionModerationError";
    this.code = code;
    this.status = status;
  }
}

type ApiErrorBody = { message?: string; code?: string };

export function getSubmissionApiErrorMessage(error: unknown): string {
  const fallback = "Không thể kiểm duyệt bài thi. Vui lòng thử lại.";

  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

// /request-proof is planned per OpenAPI; backend FPC-093 must mount it and store the Organizer-set deadline.
export async function requestProof(
  id: string,
  payload: ProofRequestPayload,
): Promise<ProofRequestResponse> {
  const response = await http.post<unknown>(
    `/api/v1/submissions/${id}/request-proof`,
    payload,
  );
  const body = response.data as
    | { data?: ProofRequestResponse | null }
    | ProofRequestResponse
    | null;

  return (
    (body && "data" in body
      ? body.data
      : (body as ProofRequestResponse | null)) ?? {}
  );
}

export async function moderateSubmission(
  id: string,
  action: ModerationAction,
  reason?: string,
): Promise<void> {
  await http.post(`/api/v1/submissions/${id}/moderate`, {
    action,
    ...(reason ? { reason } : {}),
  });
}
