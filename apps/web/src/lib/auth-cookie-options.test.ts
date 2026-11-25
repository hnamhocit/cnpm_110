import { describe, expect, test } from "bun:test";

import {
  ACCESS_COOKIE,
  accessCookieOptions,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
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

  test("refresh cookie follows SRS Module 01", () => {
    const options = refreshCookieOptions();

    expect(REFRESH_COOKIE).toBe("refreshToken");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("strict");
    expect(options.path).toBe(REFRESH_COOKIE_PATH);
    expect(options.path).toBe("/api/v1/auth");
    expect(options.maxAge).toBe(604_800);
  });
});
