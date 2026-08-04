// @vitest-environment node
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Phase Five authorization and scope boundaries", () => {
  it("keeps outreach mutations behind administrator authorization", async () => {
    const actions = await readFile(
      join(process.cwd(), "src/app/admin-portal/actions.ts"),
      "utf8",
    );
    expect(actions).toContain("export async function saveDraftAction");
    expect(actions).toContain("const admin = await requireAdmin()");
    expect(actions).toContain("phaseFiveReady");
    expect(actions).toContain("verificationStatus");
  });

  it("contains no outbound delivery provider or production scheduler", async () => {
    const actions = await readFile(
      join(process.cwd(), "src/app/admin-portal/actions.ts"),
      "utf8",
    );
    expect(actions).not.toMatch(/sendEmail|resend\.emails|emailSequence/i);
    await expect(stat(join(process.cwd(), "vercel.json"))).rejects.toThrow();
  });

  it("ships the approved logo and application-icon files", async () => {
    for (const path of [
      "public/orbisy-horizontal-color.png",
      "public/orbisy-mark.png",
      "src/app/favicon.ico",
      "src/app/icon.png",
      "src/app/apple-icon.png",
    ]) {
      expect((await stat(join(process.cwd(), path))).size).toBeGreaterThan(1000);
    }
  });
});
