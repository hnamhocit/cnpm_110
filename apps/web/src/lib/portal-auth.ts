import type { RouteDecision } from "./route-access";

export async function checkPortalAccess(
  accessToken: string | null,
): Promise<RouteDecision> {
  // Chưa có token
  if (!accessToken) {
    return "login";
  }

  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

  const response = await fetch(`${apiUrl}/rbac/manage-contest`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

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
