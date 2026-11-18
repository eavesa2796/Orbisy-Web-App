import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
const db = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ getDb: db }));
import Page from "./page";
afterEach(() => { vi.unstubAllEnvs(); db.mockClear(); });
it("keeps the fictional sales preview unavailable in production and reads no database records", async () => { vi.stubEnv("VERCEL_ENV", "production"); await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow(/404/); vi.stubEnv("VERCEL_ENV", "preview"); const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ days: "0" }) })); expect(html).toContain("Fictional example data"); expect(html).toContain("saved at any time"); expect(html).toContain("Not captured"); expect(db).not.toHaveBeenCalled(); });
