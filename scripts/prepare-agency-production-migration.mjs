import { PGlite } from '@electric-sql/pglite';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const db = new PGlite();
const journal = JSON.parse(await readFile('drizzle/meta/_journal.json','utf8')).entries;
for(const e of journal.filter(e=>e.idx<=7)) await db.exec((await readFile(`drizzle/${e.tag}.sql`,'utf8')).replaceAll('--> statement-breakpoint',''));
const catalog = `
select 'column'::text as kind,c.relname||'.'||a.attname as name,
 jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) as value
from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid
left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
union all
select 'constraint',c.relname||'.'||co.conname,jsonb_build_object('definition',pg_get_constraintdef(co.oid),'validated',co.convalidated)
from pg_constraint co join pg_class c on c.oid=co.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and co.contype <> 'n'
union all
select 'index',c.relname||'.'||ic.relname,jsonb_build_object('definition',pg_get_indexdef(i.indexrelid),'valid',i.indisvalid)
from pg_index i join pg_class c on c.oid=i.indrelid join pg_class ic on ic.oid=i.indexrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
union all
select 'table',c.relname,jsonb_build_object('rls',c.relrowsecurity,'forced',c.relforcerowsecurity)
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'
union all
select 'enum',t.typname,jsonb_build_object('labels',jsonb_agg(e.enumlabel order by e.enumsortorder))
from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' group by t.typname
union all
select 'policy',tablename||'.'||policyname,jsonb_build_object('permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'with_check',with_check) from pg_policies where schemaname='public'
`;
const expected = (await db.query(catalog)).rows;

const query = `with expected as (select * from jsonb_to_recordset($expected$${JSON.stringify(expected)}$expected$::jsonb) as x(kind text,name text,value jsonb)), actual as (${catalog}), differences as (select coalesce(e.kind,a.kind) as kind,coalesce(e.name,a.name) as name,e.value as expected,a.value as actual from expected e full join actual a on a.kind=e.kind and a.name=e.name where e.value is distinct from a.value and not (coalesce(e.kind,'')='table' and a.value=e.value||jsonb_build_object('rls',true))) select kind,name,expected,actual from differences order by kind,name;`;
const hashes = await Promise.all(journal.map(async e => ({when:e.when,hash:createHash('sha256').update(await readFile(`drizzle/${e.tag}.sql`)).digest('hex')})));
const historyValues = hashes.slice(0,3).map(e=>`(${e.when}::bigint,'${e.hash}')`).join(',');
const insertValues = hashes.slice(3).map(e=>`('${e.hash}',${e.when})`).join(',\n');
const tables = expected.filter(e=>e.kind==='table').map(e=>e.name).sort();
const backup = 'orbisy_release_20261006';
const migration = (await readFile('drizzle/0008_agency_pricing_notifications.sql','utf8')).replaceAll('--> statement-breakpoint','');
const sql = `-- Orbisy production release: project xjmoroanmpnipntmadcb.
-- Run ONLY after confirming the application DATABASE_URL targets this project.
-- Generated from exact migrations 0000–0008; never connects to a database.
-- Valid only for the verified 0007 schema with journal rows 0000–0002.
-- Preserves stronger RLS. Any schema/history drift aborts before mutation.
-- Creates a private application-row recovery copy; this is NOT an external backup.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL search_path = public, pg_catalog;
LOCK TABLE ${tables.map(t=>`public."${t}"`).join(',')} IN SHARE MODE;
LOCK TABLE drizzle.__drizzle_migrations IN ACCESS EXCLUSIVE MODE;
DO $guard$
DECLARE mismatch_count integer;
BEGIN
 SELECT count(*) INTO mismatch_count FROM (${query.replace(/;$/, '')}) d;
 IF mismatch_count <> 0 THEN RAISE EXCEPTION 'Schema drift: % differences. Release aborted.',mismatch_count; END IF;
 WITH expected(created_at,hash) AS (VALUES ${historyValues})
 SELECT count(*) INTO mismatch_count FROM expected e FULL JOIN drizzle.__drizzle_migrations a ON a.created_at=e.created_at AND a.hash=e.hash WHERE e.created_at IS NULL OR a.created_at IS NULL;
 IF mismatch_count <> 0 OR (SELECT count(*) FROM drizzle.__drizzle_migrations) <> 3 THEN RAISE EXCEPTION 'Migration history changed. Release aborted.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE lower(email)='anthonyeaves33@gmail.com') THEN RAISE EXCEPTION 'Expected administrator is absent. Release aborted.'; END IF;
END $guard$;
CREATE SCHEMA ${backup};
REVOKE ALL ON SCHEMA ${backup} FROM PUBLIC, anon, authenticated;
CREATE TABLE ${backup}.manifest (table_name text PRIMARY KEY,row_count bigint NOT NULL,captured_at timestamptz NOT NULL DEFAULT now());
${tables.map(t=>`CREATE TABLE ${backup}."${t}" AS TABLE public."${t}";\nALTER TABLE ${backup}."${t}" ENABLE ROW LEVEL SECURITY;\nINSERT INTO ${backup}.manifest(table_name,row_count) SELECT '${t}',count(*) FROM ${backup}."${t}";`).join('\n')}
CREATE TABLE ${backup}.drizzle_migrations AS TABLE drizzle.__drizzle_migrations;
REVOKE ALL ON ALL TABLES IN SCHEMA ${backup} FROM PUBLIC, anon, authenticated;
ALTER TABLE ${backup}.manifest ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${backup}.drizzle_migrations ENABLE ROW LEVEL SECURITY;
${migration}
INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES
${insertValues};
DO $verify$
DECLARE item record; current_count bigint; mismatched_rows boolean;
BEGIN
 FOR item IN SELECT * FROM ${backup}.manifest LOOP
  EXECUTE format('SELECT count(*) FROM public.%I',item.table_name) INTO current_count;
  IF current_count <> item.row_count THEN RAISE EXCEPTION 'Record count changed for %',item.table_name; END IF;
  EXECUTE format('SELECT EXISTS((SELECT to_jsonb(t) - CASE WHEN %L = ''contact_submissions'' THEN ''attribution'' ELSE ''__orbisy_no_column__'' END FROM public.%I t EXCEPT SELECT to_jsonb(t) FROM ${backup}.%I t) UNION ALL (SELECT to_jsonb(t) FROM ${backup}.%I t EXCEPT SELECT to_jsonb(t) - CASE WHEN %L = ''contact_submissions'' THEN ''attribution'' ELSE ''__orbisy_no_column__'' END FROM public.%I t))',item.table_name,item.table_name,item.table_name,item.table_name,item.table_name,item.table_name) INTO mismatched_rows;
  IF mismatched_rows THEN RAISE EXCEPTION 'Record contents changed for %',item.table_name; END IF;
 END LOOP;
 IF (SELECT count(*) FROM drizzle.__drizzle_migrations) <> 9 THEN RAISE EXCEPTION 'Journal verification failed'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('pricing_entries','submission_notifications') AND NOT c.relrowsecurity) OR (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('pricing_entries','submission_notifications')) <> 0 THEN RAISE EXCEPTION 'Private table security verification failed'; END IF;
END $verify$;
COMMIT;
SELECT '0008 applied; original rows preserved' AS release_status,
 (SELECT count(*) FROM public.leads) AS lead_count,
 (SELECT count(*) FROM public.contact_submissions) AS inquiry_count,
 (SELECT count(*) FROM drizzle.__drizzle_migrations) AS migration_count,
 (SELECT count(*) FROM ${backup}.manifest) AS copied_application_tables;
`;
const output = process.argv[2];
if (!output) throw new Error('Supply a SQL output path. No database was contacted.');
await writeFile(output, sql);
console.log(JSON.stringify({output,checkedObjects:expected.length,applicationTables:tables.length,bytes:sql.length}));
await db.close();
