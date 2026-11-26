import { describe, expect, test } from "bun:test";
import { createTestApp } from "./helpers/test-app";
import contests from "../src/routes/contests.route";

describe("FPC-087: Contest Registration & Participant Registrations (UC-17, UC-34)", () => {
  const app = createTestApp();
  app.route("/api/v1/contests", contests);

  test("UC-34: Registration rejects when unauthenticated (401)", async () => {
    const res = await app.request("/api/v1/contests/9d980393-a6f6-4bfd-8581-984d56d9f5f9/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: "fb740a40-e34e-4efb-b267-8c3b61b6f0ca", termsAccepted: true }),
    });
    expect(res.status).toBe(401);
  });

  test("UC-17: Listing registrations rejects when unauthenticated (401)", async () => {
    const res = await app.request("/api/v1/contests/9d980393-a6f6-4bfd-8581-984d56d9f5f9/registrations");
    expect(res.status).toBe(401);
  });
});
