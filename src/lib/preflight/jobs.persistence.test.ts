// @vitest-environment node
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, afterEach, describe, expect, it } from "vitest";

let db: PGlite;
const leadId = "3f66ca54-a0e6-4e20-898b-3a270c113225";
async function apply(name: string) {
  const sql = (await readFile(join(process.cwd(), "drizzle", name), "utf8")).replaceAll("--> statement-breakpoint", "");
  await db.exec(sql);
}
async function addJob(id: string, status = "queued", priority = 0) {
  await db.query(
    `insert into preflight_jobs (id,lead_id,status,preflight_version,idempotency_key,priority)
     values ($1,$2,$3,$4,$5,$6)`,
    [id, leadId, status, "preflight-v1", `key-${id}`, priority],
  );
}

beforeEach(async () => {
  db = new PGlite();
  await apply("0000_boring_calypso.sql"); await apply("0001_parallel_vampiro.sql");
  await apply("0002_bouncy_madame_masque.sql"); await apply("0003_foamy_vulture.sql");
  await db.query(`insert into leads (id,business_name,source_name,status) values ($1,'Queue fixture','Test','needs_review')`, [leadId]);
});
afterEach(async () => db.close());

describe("database-backed preflight queue invariants", () => {
  it("prevents duplicate active jobs for one lead and version", async () => {
    await addJob("11111111-1111-4111-8111-111111111111");
    await expect(addJob("22222222-2222-4222-8222-222222222222", "retry_scheduled")).rejects.toThrow();
  });

  it("allows historical completed jobs while keeping one active job", async () => {
    const first = "11111111-1111-4111-8111-111111111111";
    await addJob(first); await db.query(`update preflight_jobs set status='passed',completed_at=now() where id=$1`, [first]);
    await addJob("22222222-2222-4222-8222-222222222222");
    const result = await db.query<{ status: string }>(`select status from preflight_jobs order by created_at,id`);
    expect(result.rows.map(row => row.status).sort()).toEqual(["passed", "queued"]);
  });

  it("claims a bounded batch in priority order and increments attempts", async () => {
    const first = "11111111-1111-4111-8111-111111111111";
    const secondLead = "4f66ca54-a0e6-4e20-898b-3a270c113226";
    await db.query(`insert into leads (id,business_name,source_name,status) values ($1,'Second fixture','Test','needs_review')`, [secondLead]);
    await addJob(first, "queued", 1);
    await db.query(`insert into preflight_jobs (id,lead_id,status,preflight_version,idempotency_key,priority) values ($1,$2,'queued','preflight-v1',$3,10)`, ["22222222-2222-4222-8222-222222222222", secondLead, "second-key"]);
    const claimed = await db.query<{ id: string; attempt_count: number; status: string }>(`
      with claimable as (
        select id from preflight_jobs where status in ('queued','retry_scheduled') and scheduled_at <= now()
        order by priority desc, scheduled_at asc for update skip locked limit 1
      ) update preflight_jobs j set status='running',claimed_at=now(),worker_id='test-worker',
        attempt_count=j.attempt_count+1,updated_at=now() from claimable c where j.id=c.id returning j.id,j.attempt_count,j.status
    `);
    expect(claimed.rows).toEqual([{ id: "22222222-2222-4222-8222-222222222222", attempt_count: 1, status: "running" }]);
    const remaining = await db.query<{ count: number }>(`select count(*)::int as count from preflight_jobs where status='queued'`);
    expect(remaining.rows[0]?.count).toBe(1);
  });
});
