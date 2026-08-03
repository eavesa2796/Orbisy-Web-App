// @vitest-environment node
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let db: PGlite;
const leadId = "3f66ca54-a0e6-4e20-898b-3a270c113225";
const eligibilityId = "4a6f55d6-27e9-4a6c-9e0a-25dd068ce59f";
async function apply(name: string) { const migration = (await readFile(join(process.cwd(), "drizzle", name), "utf8")).replaceAll("--> statement-breakpoint", ""); await db.exec(migration); }

beforeEach(async () => {
  db = new PGlite();
  for (const name of ["0000_boring_calypso.sql", "0001_parallel_vampiro.sql", "0002_bouncy_madame_masque.sql", "0003_foamy_vulture.sql", "0004_glamorous_doctor_spectrum.sql", "0005_nifty_vindicator.sql"]) await apply(name);
  await db.query("insert into leads (id,business_name,source_name,status) values ($1,'Audit fixture','Test','qualified')", [leadId]);
  await db.query("insert into audit_eligibility_decisions (id,lead_id,status,explanation,is_override) values ($1,$2,'eligible','Approved',true)", [eligibilityId, leadId]);
});
afterEach(async () => db.close());

async function addJob(id: string, status = "queued") {
  await db.query("insert into audit_jobs (id,lead_id,eligibility_decision_id,status,audit_version,idempotency_key) values ($1,$2,$3,$4,'deep-audit-v1',$5)", [id, leadId, eligibilityId, status, `key-${id}`]);
}

describe("deep-audit persistence invariants", () => {
  it("prevents duplicate active jobs but preserves completed history", async () => {
    const first = "11111111-1111-4111-8111-111111111111"; await addJob(first);
    await expect(addJob("22222222-2222-4222-8222-222222222222", "retry_scheduled")).rejects.toThrow();
    await db.query("update audit_jobs set status='completed',completed_at=now() where id=$1", [first]);
    await addJob("33333333-3333-4333-8333-333333333333");
    const statuses = await db.query<{ status: string }>("select status from audit_jobs order by id");
    expect(statuses.rows.map((row) => row.status).sort()).toEqual(["completed", "queued"]);
  });
  it("claims atomically and increments attempts", async () => {
    const id = "11111111-1111-4111-8111-111111111111"; await addJob(id);
    const claimed = await db.query<{ id: string; attempt_count: number; status: string }>(`with claimable as (select id from audit_jobs where status='queued' for update skip locked limit 1) update audit_jobs j set status='running',claimed_at=now(),worker_id='worker',attempt_count=j.attempt_count+1 from claimable c where j.id=c.id returning j.id,j.attempt_count,j.status`);
    expect(claimed.rows[0]).toEqual({ id, attempt_count: 1, status: "running" });
  });
  it("recovers abandoned work without deleting prior successful runs", async () => {
    const id = "11111111-1111-4111-8111-111111111111"; await addJob(id);
    await db.query("update audit_jobs set status='running',attempt_count=1,claimed_at=now()-interval '10 minutes' where id=$1", [id]);
    await db.query("update audit_jobs set status='retry_scheduled',worker_id=null,error_classification='worker_lease_expired' where status='running' and claimed_at<now()-interval '5 minutes'");
    expect((await db.query("select status,error_classification from audit_jobs where id=$1", [id])).rows[0]).toMatchObject({ status: "retry_scheduled", error_classification: "worker_lease_expired" });
  });
});
