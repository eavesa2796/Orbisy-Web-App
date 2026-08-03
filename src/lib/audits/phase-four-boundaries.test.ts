// @vitest-environment node
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Phase Four authorization and scope boundaries", () => {
  it("keeps admin pages and mutations behind server authorization", async () => {
    for (const path of ["src/app/admin-portal/audits/page.tsx", "src/app/admin-portal/audits/[id]/page.tsx", "src/app/admin-portal/audits/actions.ts"]) {
      expect(await readFile(join(process.cwd(), path), "utf8")).toContain("requireAdmin");
    }
  });
  it("protects the worker with the separate secret", async () => {
    const route = await readFile(join(process.cwd(), "src/app/api/internal/deep-audit-worker/route.ts"), "utf8");
    expect(route).toContain("validDeepAuditWorkerSecret");
    expect(route).not.toContain("PREFLIGHT_WORKER_SECRET");
  });
  it("does not add a production scheduler", async () => {
    await expect(stat(join(process.cwd(), "vercel.json"))).rejects.toThrow();
  });
});
