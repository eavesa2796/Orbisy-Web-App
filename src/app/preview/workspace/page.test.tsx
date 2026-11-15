import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ getDb: db }));
import Page from "@/app/preview/workspace/page";
afterEach(() => {
  vi.unstubAllEnvs();
  db.mockClear();
});
describe("Preview-only design review", () => {
  it("is unavailable in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      /404/,
    );
    expect(db).not.toHaveBeenCalled();
  });
  it("uses only fictional data without reading the database", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const html = renderToStaticMarkup(
      await Page({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("Fictional example data");
    expect(html).toContain("Example Association");
    expect(db).not.toHaveBeenCalled();
  });
  it("disables all example form submissions", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const view of ["client", "discovery"]) {
      const html = renderToStaticMarkup(
        await Page({ searchParams: Promise.resolve({ view }) }),
      );
      expect(html).toContain('fieldset disabled=""');
    }
    expect(db).not.toHaveBeenCalled();
  });
});
