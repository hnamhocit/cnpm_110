import { describe, expect, test } from "bun:test";

import { getRouteDecision } from "./route-access";

describe("FPC-19 Route Guards", () => {
  test("Public pages do not require login", () => {
    expect(getRouteDecision("/", null)).toBe("public");
    expect(getRouteDecision("/login", null)).toBe("public");
    expect(getRouteDecision("/register", null)).toBe("public");
  });

  test("Unauthenticated users must log in", () => {
    expect(getRouteDecision("/portal", null)).toBe("login");
  });

  test("Admin and Organizer can access Portal", () => {
    expect(getRouteDecision("/portal", "Admin")).toBe("allow");
    expect(getRouteDecision("/portal", "Organizer")).toBe("allow");
  });

  test("Judge and Participant cannot access Portal", () => {
    expect(getRouteDecision("/portal", "Judge")).toBe("forbidden");
    expect(getRouteDecision("/portal/contests", "Participant")).toBe(
      "forbidden",
    );
  });

  test("Other routes are not mistaken for Portal", () => {
    expect(getRouteDecision("/portal-other", null)).toBe("public");
  });
});
