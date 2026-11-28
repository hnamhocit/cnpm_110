import { afterEach, expect, test } from "bun:test";
import { loadCurrentUser, useUserStore } from "./user-store";

const originalFetch = globalThis.fetch;
const user = {
  id: "organizer",
  fullName: "Organizer",
  email: "test@example.com",
  role: "Organizer" as const,
};
afterEach(() => {
  globalThis.fetch = originalFetch;
  useUserStore.getState().clearUser();
});
test("concurrent consumers and navigation share one request", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return Response.json({ user });
  }) as unknown as typeof fetch;
  expect(await Promise.all([loadCurrentUser(), loadCurrentUser()])).toEqual([
    user,
    user,
  ]);
  expect(await loadCurrentUser()).toEqual(user);
  expect(calls).toBe(1);
});
test("logout prevents an old request restoring the user", async () => {
  let finish!: (response: Response) => void;
  globalThis.fetch = (() =>
    new Promise<Response>((resolve) => {
      finish = resolve;
    })) as unknown as typeof fetch;
  const request = loadCurrentUser();
  useUserStore.getState().clearUser();
  finish(Response.json({ user }));
  expect(await request).toBeNull();
  expect(useUserStore.getState().user).toBeNull();
});
test("expired cache revalidates and 401 clears the user", async () => {
  useUserStore.getState().setUser(user);
  useUserStore.setState({ loadedAt: Date.now() - 6 * 60_000 });
  globalThis.fetch = (async () =>
    new Response(null, { status: 401 })) as unknown as typeof fetch;
  expect(await loadCurrentUser()).toBeNull();
  expect(useUserStore.getState().user).toBeNull();
});
test("temporary errors can be retried", async () => {
  let calls = 0;
  globalThis.fetch = (async () =>
    ++calls === 1
      ? new Response(null, { status: 502 })
      : Response.json({ user })) as unknown as typeof fetch;
  await expect(loadCurrentUser()).rejects.toThrow();
  expect(await loadCurrentUser()).toEqual(user);
});
