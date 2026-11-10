import { describe, expect, test } from "bun:test";

import {
  ACCESS_COOKIE,
  accessCookieOptions,
  REFRESH_COOKIE,
  refreshCookieOptions,
} from "./auth-cookie-options";

describe("auth cookie options", () => {
  test("access cookie is HttpOnly and short-lived", () => {
    const options = accessCookieOptions();

    expect(ACCESS_COOKIE).toBe("access_token");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(900);
  });

  test("refresh cookie is HttpOnly and scoped to auth routes", () => {
    const options = refreshCookieOptions();

    expect(REFRESH_COOKIE).toBe("refresh_token");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/api/auth");
    expect(options.maxAge).toBe(7 * 24 * 60 * 60);
  });
});
