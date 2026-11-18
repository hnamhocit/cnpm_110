import type { RouteDecision } from "./route-access";
import { canAccessPortal, type Role } from "./route-access";
import { API_INTERNAL_URL } from "./server-api";

function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export async function checkPortalAccess(
  accessToken: string | null,
): Promise<RouteDecision> {
  // Chưa có token
  if (!accessToken) {
    return "login";
  }

  // Thử gọi backend RBAC endpoint
  let response: Response;
  try {
    response = await fetch(
      `${API_INTERNAL_URL}/api/v1/rbac/manage-contest`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );
  } catch {
    // Nếu kết nối backend bị lỗi hoặc timeout, fallback kiểm tra qua role trong JWT
    const payload = decodeJwtPayload(accessToken);
    if (payload && canAccessPortal((payload.role as Role) ?? null)) {
      return "allow";
    }
    return "login";
  }

  if (response.status === 401) {
    return "login";
  }

  if (response.status === 403) {
    return "forbidden";
  }

  if (response.ok) {
    return "allow";
  }

  // Ném lỗi với mã lỗi API khi backend trả về 500 hoặc mã lỗi khác
  throw new Error(`Authentication API error: ${response.status}`);
}
