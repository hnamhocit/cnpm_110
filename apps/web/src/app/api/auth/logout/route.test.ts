import { expect, spyOn, test } from "bun:test";
import { NextRequest } from "next/server";

import { POST } from "./route";

test("logout revokes the session and expires cookies on both refresh paths", async () => {
  const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ data: null }),
  );
  try {
    const response = await POST(
      new NextRequest("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { cookie: "access_token=access; refresh_token=refresh" },
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/auth\/logout$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh" }),
      }),
    );
    const cookies = response.headers.getSetCookie();
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^access_token=; Path=\/; Max-Age=0/),
        expect.stringMatching(/^refresh_token=; Path=\/api\/auth; Max-Age=0/),
        expect.stringMatching(/^refresh_token=; Path=\/; Max-Age=0/),
      ]),
    );
  } finally {
    fetchMock.mockRestore();
  }
});
