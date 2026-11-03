import { cookies } from "next/headers";

import { API_INTERNAL_URL } from "@/lib/server-api";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch user data" },
        { status: response.status },
      );
    }

    const user = await response.json();
    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
