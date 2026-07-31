// @vitest-environment node

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

async function migration(name: string) {
  return (
    await readFile(join(process.cwd(), "drizzle", name), "utf8")
  ).replaceAll("--> statement-breakpoint", "");
}

describe("Phase Two migrations", () => {
  it("preserves Phase One data and adds import structures", async () => {
    const db = new PGlite();
    await db.exec(await migration("0000_boring_calypso.sql"));
    const leadId = "3f66ca54-a0e6-4e20-898b-3a270c113225";
    await db.query(
      `insert into leads (id, business_name, source_name, status)
       values ($1, $2, $3, $4)`,
      [leadId, "Existing Phase One Business", "Inbound project request", "new_inbound"],
    );

    await db.exec(await migration("0001_parallel_vampiro.sql"));
    await db.exec(await migration("0002_bouncy_madame_masque.sql"));

    const existing = await db.query<{ business_name: string }>(
      "select business_name from leads where id = $1",
      [leadId],
    );
    const tables = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_name like 'import_%'
       order by table_name`,
    );

    expect(existing.rows[0]?.business_name).toBe("Existing Phase One Business");
    expect(tables.rows.map((row) => row.table_name)).toEqual([
      "import_batches",
      "import_candidates",
    ]);
    await db.close();
  }, 20_000);
});
