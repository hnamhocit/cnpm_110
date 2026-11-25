import { canAccessPortal, type Role, type RouteDecision } from "./route-access";
import { API_INTERNAL_URL } from "./server-api";

export async function checkPortalAccess(
  accessToken: string | null,
): Promise<RouteDecision> {
  if (!accessToken) {
    return "login";
  }

  let response: Response;
  try {
    response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    // Backend không phản hồi: fail closed. Không tin role trong JWT chưa xác thực
    // (JWT do client giữ, có thể bị sửa) để tránh bypass phân quyền.
    return "login";
  }

  if (response.status === 401) {
    return "login";
  }

  if (response.status === 403) {
    return "forbidden";
  }

  if (!response.ok) {
    // Fail closed nhưng không ném lỗi làm crash Server Component.
    return "login";
  }

  // biome-ignore lint/suspicious/noExplicitAny: response unwrap
  const rawData = (await response.json().catch(() => ({}))) as any;
  const user = rawData?.data?.user ?? rawData?.data ?? rawData?.user ?? rawData;
  const role = typeof user?.role === "string" ? (user.role as Role) : null;

  return canAccessPortal(role) ? "allow" : "forbidden";
}
