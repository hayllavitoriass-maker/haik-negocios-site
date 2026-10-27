import { vi } from "vitest";

/**
 * `next/headers` e `react.cache` não existem fora do runtime do Next.
 * Os testes de integração injetam cookies/headers através destes mocks.
 */
export const testHeaders = new Map<string, string>([["user-agent", "vitest"], ["x-forwarded-for", "127.0.0.1"]]);
export const testCookies = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => testHeaders.get(k.toLowerCase()) ?? null }),
  cookies: async () => ({
    get: (k: string) => (testCookies.has(k) ? { name: k, value: testCookies.get(k)! } : undefined),
    set: (k: string, v: string) => testCookies.set(k, v),
    delete: (k: string) => testCookies.delete(k),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/server", async () => {
  return { after: (fn: () => unknown) => void Promise.resolve().then(fn), NextResponse: class {} };
});

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...a: unknown[]) => unknown>(fn: T) => fn };
});
