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

describe("Phase Four migration", () => {
  it("preserves Phase One through Three data and adds bounded audit history", async () => {
    const db = new PGlite();
    await db.exec(await migration("0000_boring_calypso.sql"));
    const leadId = "3f66ca54-a0e6-4e20-898b-3a270c113225";
    await db.query(
      `insert into leads (id,business_name,source_name,status)
       values ($1,'Existing business','Inbound','new_inbound')`,
      [leadId],
    );

    await db.exec(await migration("0001_parallel_vampiro.sql"));
    await db.exec(await migration("0002_bouncy_madame_masque.sql"));
    const batchId = "b94295f4-796c-45aa-8894-c5f3fb518e15";
    await db.query(
      `insert into import_batches (id,original_filename,source_name,created_by,status)
       values ($1,'phase2.csv','Permitted CSV','admin@example.com','completed')`,
      [batchId],
    );

    await db.exec(await migration("0003_foamy_vulture.sql"));
    const preflightJobId = "c76c378b-5e36-4487-b9fc-d2bc7d832e33";
    const preflightRunId = "54b97e7d-4ac4-4efd-a3aa-3a43c223323e";
    const fitScoreId = "f3c3dfaa-c731-4c25-8211-836877a408e0";
    const eligibilityId = "4a6f55d6-27e9-4a6c-9e0a-25dd068ce59f";
    await db.query(
      `insert into preflight_jobs
       (id,lead_id,status,preflight_version,idempotency_key)
       values ($1,$2,'passed','preflight-v1','phase3-fixture')`,
      [preflightJobId, leadId],
    );
    await db.query(
      `insert into preflight_runs
       (id,lead_id,job_id,preflight_version,status,website_listing_state)
       values ($1,$2,$3,'preflight-v1','passed','provided')`,
      [preflightRunId, leadId, preflightJobId],
    );
    await db.query(
      `insert into business_fit_scores
       (id,lead_id,run_id,score_version,total_score,factors,eligibility_gates,input_snapshot)
       values ($1,$2,$3,'business-fit-v1',80,'[]','[]','{}')`,
      [fitScoreId, leadId, preflightRunId],
    );
    await db.query(
      `insert into audit_eligibility_decisions
       (id,lead_id,run_id,score_id,status,explanation)
       values ($1,$2,$3,$4,'eligible','Fixture is eligible')`,
      [eligibilityId, leadId, preflightRunId, fitScoreId],
    );
    await db.query("insert into app_settings (id) values ('default')");

    await db.exec(await migration("0004_glamorous_doctor_spectrum.sql"));
    await db.exec(await migration("0005_nifty_vindicator.sql"));

    const auditJobId = "d994d3c6-941f-49dc-91ee-19a4575db718";
    await db.query(
      `insert into audit_jobs
       (id,lead_id,eligibility_decision_id,audit_version,idempotency_key)
       values ($1,$2,$3,'deep-audit-v1','phase4-fixture')`,
      [auditJobId, leadId, eligibilityId],
    );

    expect((await db.query("select business_name from leads where id=$1", [leadId])).rows[0])
      .toMatchObject({ business_name: "Existing business" });
    expect((await db.query("select original_filename from import_batches where id=$1", [batchId])).rows[0])
      .toMatchObject({ original_filename: "phase2.csv" });
    expect((await db.query("select total_score from business_fit_scores where id=$1", [fitScoreId])).rows[0])
      .toMatchObject({ total_score: 80 });
    expect((await db.query("select status, max_attempts from audit_jobs where id=$1", [auditJobId])).rows[0])
      .toMatchObject({ status: "queued", max_attempts: 3 });

    const settings = await db.query<{
      deep_audit_enabled: boolean;
      deep_audit_worker_enabled: boolean;
      max_pages_per_audit: number;
      max_internal_links_checked: number;
      max_concurrent_audits: number;
      max_audit_jobs_per_worker_run: number;
    }>(
      `select deep_audit_enabled,deep_audit_worker_enabled,max_pages_per_audit,
              max_internal_links_checked,max_concurrent_audits,max_audit_jobs_per_worker_run
       from app_settings where id='default'`,
    );
    expect(settings.rows[0]).toMatchObject({
      deep_audit_enabled: false,
      deep_audit_worker_enabled: false,
      max_pages_per_audit: 3,
      max_internal_links_checked: 20,
      max_concurrent_audits: 1,
      max_audit_jobs_per_worker_run: 1,
    });

    const secured = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class
       where relname in ('audit_jobs','audit_runs','audit_pages','audit_findings',
                         'score_versions','website_improvement_scores',
                         'audit_confidence_scores','audit_review_events')
       order by relname`,
    );
    expect(secured.rows).toHaveLength(8);
    expect(secured.rows.every((row) => row.relrowsecurity)).toBe(true);
    await expect(db.query("update app_settings set max_pages_per_audit=100 where id='default'"))
      .rejects.toThrow();
    await db.close();
  }, 30_000);
});
