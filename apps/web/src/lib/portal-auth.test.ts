import {
  afterEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

import { checkPortalAccess } from "./portal-auth";


afterEach(() => {
  // Khôi phục các hàm được mock sau mỗi test
  mock.restore();
});

function mockApiResponse(status: number) {
  // Giả lập fetch mà không gán đè trực tiếp
  spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status })
  );
}


describe("FPC-19 Portal Authentication", () => {
  test("No token -> Login", async () => {
    const result = await checkPortalAccess(null);

    expect(result).toBe("login");
  });

  test("200 -> Allow access", async () => {
    mockApiResponse(200);

    const result = await checkPortalAccess("test-token");

    expect(result).toBe("allow");
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

  test("500 -> Throw an error", async () => {
    mockApiResponse(500);

    await expect(
      checkPortalAccess("test-token")
    ).rejects.toThrow("Authentication API error: 500");
  });
});
