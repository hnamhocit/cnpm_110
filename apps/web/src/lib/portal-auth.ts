import type { RouteDecision } from "./route-access";

import { API_INTERNAL_URL } from "./server-api";

export async function checkPortalAccess(
  accessToken: string | null,
): Promise<RouteDecision> {
  // Chưa có token
  if (!accessToken) {
    return "login";
  }

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

  throw new Error(`Authentication API error: ${response.status}`);
}
