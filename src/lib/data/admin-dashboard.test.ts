// @vitest-environment node

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { DASHBOARD_SECONDARY_SUMMARY_SQL } from "@/lib/data/admin";

async function migration(name: string) {
  return (
    await readFile(join(process.cwd(), "drizzle", name), "utf8")
  ).replaceAll("--> statement-breakpoint", "");
}

describe("administrator dashboard summaries", () => {
  it("runs the consolidated summary against the complete schema", async () => {
    const db = new PGlite();
    for (const name of [
      "0000_boring_calypso.sql",
      "0001_parallel_vampiro.sql",
      "0002_bouncy_madame_masque.sql",
      "0003_foamy_vulture.sql",
      "0004_glamorous_doctor_spectrum.sql",
      "0005_nifty_vindicator.sql",
      "0006_rich_shadow_king.sql",
      "0007_pale_madelyne_pryor.sql",
    ]) {
      await db.exec(await migration(name));
    }

    const result = await db.query<Record<string, number>>(
      DASHBOARD_SECONDARY_SUMMARY_SQL,
    );

    expect(result.rows[0]).toMatchObject({
      pending_batches: 0,
      review_rows: 0,
      preflight_attention: 0,
      audit_attention: 0,
      ready_for_brief: 0,
      eligible_waiting: 0,
    });
    await db.close();
  }, 30_000);
});
