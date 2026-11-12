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

  // 1. Kiểm tra nhanh JWT payload
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return "login";
  }

  // 2. Thử gọi backend RBAC endpoint
  try {
    const response = await fetch(
      `${API_INTERNAL_URL}/api/v1/rbac/manage-contest`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (response.status === 401) {
      return "login";
    }

    if (response.status === 403) {
      return "forbidden";
    }

    if (response.ok) {
      return "allow";
    }
  } catch {
    // Network error or endpoint issue, continue to fallback
  }

  // 3. Fallback: Kiểm tra quyền trực tiếp qua role trong token
  if (canAccessPortal((payload.role as Role) ?? null)) {
    return "allow";
  }

  return "forbidden";
}
