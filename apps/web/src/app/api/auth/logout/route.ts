import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookie-options";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete({
    name: REFRESH_COOKIE,
    path: "/api/auth",
  });
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");

  return Response.json({ success: true });
}
