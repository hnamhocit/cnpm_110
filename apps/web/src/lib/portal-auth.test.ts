import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";

import { checkPortalAccess } from "./portal-auth";

afterEach(() => {
  // Khôi phục các hàm được mock sau mỗi test
  mock.restore();
});

function mockApiResponse(status: number, body?: unknown) {
  spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json(body ?? null, { status }),
  );
}

describe("FPC-19 Portal Authentication", () => {
  test("No token -> Login", async () => {
    const result = await checkPortalAccess(null);

    expect(result).toBe("login");
  });

  test("200 + Admin role -> Allow access", async () => {
    mockApiResponse(200, { data: { user: { role: "Admin" } } });

    const result = await checkPortalAccess("test-token");

    expect(result).toBe("allow");
  });

  test("200 + Participant role -> Access Denied", async () => {
    mockApiResponse(200, { data: { user: { role: "Participant" } } });

    const result = await checkPortalAccess("test-token");

    expect(result).toBe("forbidden");
  });

  test("401 -> Redirect to Login", async () => {
    mockApiResponse(401);

    const result = await checkPortalAccess("test-token");

    expect(result).toBe("login");
  });

  test("403 -> Access Denied", async () => {
    mockApiResponse(403);

    const result = await checkPortalAccess("test-token");

    expect(result).toBe("forbidden");
  });

  test("500 -> Redirect to Login instead of crashing", async () => {
    mockApiResponse(500);

    const result = await checkPortalAccess("test-token");

    expect(result).toBe("login");
  });
});
