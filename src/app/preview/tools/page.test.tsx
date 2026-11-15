import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ getDb: db }));
import Page from "./page";
afterEach(() => {
  vi.unstubAllEnvs();
  db.mockClear();
});
describe("Tools guide review boundary", () => {
  it("returns 404 in production without reading records", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(
      Page({ searchParams: Promise.resolve({ tool: "settings" }) }),
    ).rejects.toThrow(/404/);
    expect(db).not.toHaveBeenCalled();
  });
  it("shows real help and disabled fictional settings without reading the database", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const html = renderToStaticMarkup(
      await Page({ searchParams: Promise.resolve({ tool: "settings" }) }),
    );
    expect(html).toContain("Fictional example settings");
    expect(html).toContain('fieldset disabled=""');
    expect(html).toContain("Current matching uses fixed rules");
    expect(db).not.toHaveBeenCalled();
  });
  it("routes invalid and inherited object keys back to the directory", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const tool of ["unknown", "constructor", "__proto__"]) {
      const html = renderToStaticMarkup(
        await Page({ searchParams: Promise.resolve({ tool }) }),
      );
      expect(html).toContain("What still serves Orbisy?");
    }
    expect(db).not.toHaveBeenCalled();
  });
});
