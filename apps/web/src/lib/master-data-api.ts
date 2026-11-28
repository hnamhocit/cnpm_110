import axios from "axios";
import { http } from "@/lib/http";
import { loadCurrentUser } from "@/lib/stores/user-store";
import type {
  MasterDataEntity,
  MasterDataInput,
  PaginatedMasterData,
} from "@/types/master-data";

export const MASTER_DATA_ENDPOINT = "/api/v1/master-data";

export type MasterDataQuery = {
  search?: string;
  status?: "ACTIVE" | "DEPRECATED" | "ALL";
  process?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
};

export type MasterDataErrorInfo = {
  status?: number;
  code?: string;
  message: string;
  // true khi route chưa được mount (hợp đồng còn ở trạng thái planned).
  contractGap: boolean;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function unwrapList<T>(
  body: unknown,
  fallbackLimit: number,
): PaginatedMasterData<T> {
  const root = asRecord(body) ?? {};
  const data = root.data;
  const dataRecord = asRecord(data);
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(dataRecord?.items)
      ? dataRecord.items
      : Array.isArray(root.items)
        ? root.items
        : [];

  const meta = asRecord(root.meta) ?? asRecord(dataRecord?.meta) ?? {};
  const items = rawItems as T[];
  const total =
    firstNumber(meta.total, dataRecord?.total, root.total) ?? items.length;
  const limit =
    firstNumber(meta.limit, dataRecord?.limit, root.limit) ?? fallbackLimit;
  const page = firstNumber(meta.page, dataRecord?.page, root.page) ?? 1;
  const totalPages =
    firstNumber(
      meta.total_pages,
      meta.totalPages,
      dataRecord?.totalPages,
      root.totalPages,
    ) ?? Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return { items, page, limit, total, totalPages };
}

function unwrapOne<T>(body: unknown): T {
  const root = asRecord(body) ?? {};
  return (root.data ?? root) as T;
}

export async function listMasterData<T>(
  entity: MasterDataEntity,
  query: MasterDataQuery = {},
): Promise<PaginatedMasterData<T>> {
  const limit = query.limit ?? 20;
  const params: UnknownRecord = {
    page: query.page ?? 1,
    limit,
  };
  if (query.search?.trim()) params.search = query.search.trim();
  if (query.status && query.status !== "ALL") params.status = query.status;
  if (query.process) params.process = query.process;

  const response = await http.get(`${MASTER_DATA_ENDPOINT}/${entity}`, {
    params,
    signal: query.signal,
  });
  return unwrapList<T>(response.data, limit);
}

// Hợp đồng Module 02 §4 hiện chỉ đặc tả GET/POST cho cameras và GET cho lenses/film-labs,
// DELETE cho film-stocks. Các mutation còn lại dùng cùng quy ước REST và cần FPC-080
// chốt hợp đồng trước khi nghiệm thu (xem BUG-081-02 trong checklist).
export async function createMasterData<T>(
  entity: MasterDataEntity,
  input: MasterDataInput,
): Promise<T> {
  const response = await http.post(`${MASTER_DATA_ENDPOINT}/${entity}`, input);
  return unwrapOne<T>(response.data);
}

export async function updateMasterData<T>(
  entity: MasterDataEntity,
  id: string,
  patch: UnknownRecord,
): Promise<T> {
  const response = await http.patch(
    `${MASTER_DATA_ENDPOINT}/${entity}/${id}`,
    patch,
  );
  return unwrapOne<T>(response.data);
}

export async function softDeleteMasterData(
  entity: MasterDataEntity,
  id: string,
): Promise<void> {
  await http.delete(`${MASTER_DATA_ENDPOINT}/${entity}/${id}`);
}

export async function fetchCurrentUserRole(): Promise<string | null> {
  try {
    return (await loadCurrentUser())?.role ?? null;
  } catch {
    return null;
  }
}

export function toMasterDataError(error: unknown): MasterDataErrorInfo {
  if (!axios.isAxiosError(error)) {
    return {
      message: "Không thể thực hiện yêu cầu. Vui lòng thử lại.",
      contractGap: false,
    };
  }

  const status = error.response?.status;
  const body = asRecord(error.response?.data);
  const errorField = body?.error;
  const errorObject = asRecord(errorField);
  const code =
    typeof errorObject?.code === "string"
      ? errorObject.code
      : typeof errorField === "string"
        ? errorField
        : undefined;
  const apiMessage =
    (typeof errorObject?.message === "string" && errorObject.message) ||
    (typeof body?.message === "string" && body.message) ||
    undefined;

  if (!error.response) {
    return {
      message:
        "Không thể kết nối máy chủ. Vui lòng kiểm tra đường truyền và thử lại.",
      contractGap: false,
    };
  }

  if (status === 401) {
    return {
      status,
      code,
      message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      contractGap: false,
    };
  }

  if (status === 403) {
    return {
      status,
      code,
      message: "Bạn không có quyền thực hiện thao tác này. (MSG005)",
      contractGap: false,
    };
  }

  if (status === 404) {
    // Hono trả "Route not found" khi route chưa được mount — đây là lỗi hợp đồng, không phải lỗi dữ liệu.
    const routeMissing = apiMessage === "Route not found" || !code;
    return {
      status,
      code,
      message: routeMissing
        ? "API Master Data chưa được triển khai (hợp đồng planned)."
        : "Không tìm thấy dữ liệu danh mục yêu cầu.",
      contractGap: routeMissing,
    };
  }

  if (status === 409) {
    return {
      status,
      code,
      message:
        apiMessage ?? "Bản ghi danh mục này đã tồn tại trong cơ sở dữ liệu.",
      contractGap: false,
    };
  }

  if (status === 422) {
    return {
      status,
      code,
      message:
        apiMessage ?? "Quy trình tráng không phù hợp với phân loại phim.",
      contractGap: false,
    };
  }

  if (status === 400) {
    return {
      status,
      code,
      message:
        apiMessage ??
        "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc. (MSG002)",
      contractGap: false,
    };
  }

  return {
    status,
    code,
    message: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
    contractGap: false,
  };
}
