import { afterEach, expect, test } from "bun:test";
import { refreshSession } from "./refresh-session";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("concurrent BFF callers share a rotation and later calls rotate again", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return Response.json({ data: { accessToken: "new-access", refreshToken: "new-refresh" } });
  }) as typeof fetch;
  const [first, second] = await Promise.all([refreshSession("old"), refreshSession("old")]);
  expect(calls).toBe(1);
  expect(first).toEqual(second);
  expect(first?.refreshToken).toBe("new-refresh");
  await refreshSession("old");
  expect(calls).toBe(2);
});

test("service outages remain distinguishable from expired credentials", async () => {
  globalThis.fetch = (async () => new Response(null, { status: 503 })) as typeof fetch;
  await expect(refreshSession("outage")).rejects.toThrow("503");
  globalThis.fetch = (async () => new Response(null, { status: 401 })) as typeof fetch;
  expect(await refreshSession("expired")).toBeNull();
});
