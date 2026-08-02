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

describe("Phase Three migration", () => {
  it("preserves representative Phase One and Phase Two data", async () => {
    const db = new PGlite(); await db.exec(await migration("0000_boring_calypso.sql"));
    const leadId="3f66ca54-a0e6-4e20-898b-3a270c113225"; await db.query(`insert into leads (id,business_name,source_name,status) values ($1,'Existing business','Inbound','new_inbound')`,[leadId]);
    await db.exec(await migration("0001_parallel_vampiro.sql")); await db.exec(await migration("0002_bouncy_madame_masque.sql"));
    const batchId="b94295f4-796c-45aa-8894-c5f3fb518e15"; await db.query(`insert into import_batches (id,original_filename,source_name,created_by,status) values ($1,'phase2.csv','Permitted CSV','admin@example.com','completed')`,[batchId]);
    await db.exec(await migration("0003_foamy_vulture.sql"));
    expect((await db.query(`select business_name from leads where id=$1`,[leadId])).rows[0]).toMatchObject({business_name:"Existing business"});
    expect((await db.query(`select original_filename from import_batches where id=$1`,[batchId])).rows[0]).toMatchObject({original_filename:"phase2.csv"});
    const tables=await db.query<{table_name:string}>(`select table_name from information_schema.tables where table_schema='public' and table_name like 'preflight_%' order by table_name`);
    expect(tables.rows.map(r=>r.table_name)).toEqual(["preflight_checks","preflight_jobs","preflight_runs"]); await db.close();
  },20_000);
});
