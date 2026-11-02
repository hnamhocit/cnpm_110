import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("session_csrf_token");
  const requestToken = (await cookieStore.getAll()).find(
    (c) => c.name === "X-CSRF-Token"
  );

  if (!sessionToken || !requestToken || sessionToken.value !== requestToken.value) {
    return Response.json({ success: false, error: "Invalid CSRF token" }, { status: 403 });
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("session_csrf_token");

  return Response.json({ success: true });
}
