import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
process.on('uncaughtException',error=>{console.error(error.stack);process.exit(1)});
const journal=JSON.parse(await readFile('drizzle/meta/_journal.json','utf8')).entries;
const output = process.argv[2];
if (!output) throw new Error('Supply the generated SQL file path. Only in-memory test databases are used.');
const sql=await readFile(output,'utf8');
async function fixture(){
 const db=new PGlite();
 await db.exec("create role anon; create role authenticated; create schema auth; create table auth.users(email text); insert into auth.users values('anthonyeaves33@gmail.com'); create schema drizzle; create table drizzle.__drizzle_migrations(id serial primary key,hash text not null,created_at bigint);");
 for(const e of journal.filter(e=>e.idx<8)){
  const contents=await readFile(`drizzle/${e.tag}.sql`,'utf8'); await db.exec(contents.replaceAll('--> statement-breakpoint',''));
  if(e.idx<3) await db.query('insert into drizzle.__drizzle_migrations(hash,created_at) values($1,$2)',[createHash('sha256').update(contents).digest('hex'),e.when]);
 }
 const tables=(await db.query("select tablename from pg_tables where schemaname='public'")).rows;
 for(const t of tables) await db.exec(`alter table public."${t.tablename}" enable row level security`);
 await db.exec("insert into contact_submissions(type,name,business_name,email,consent_version,idempotency_key) values('project_request','Original administrator','Existing business','admin@example.com','privacy-v1','11111111-1111-4111-8111-111111111111'); insert into leads(business_name,source_name,status) values('Existing business','Inbound','new_inbound');");
 return db;
}
const db=await fixture();
await db.exec(sql);
assert.equal((await db.query('select count(*)::int as n from drizzle.__drizzle_migrations')).rows[0].n,9);
assert.equal((await db.query('select business_name from leads')).rows[0].business_name,'Existing business');
assert.equal((await db.query('select count(*)::int as n from orbisy_release_20261006.manifest')).rows[0].n,27);
assert.equal((await db.query('select count(*)::int as n from pricing_entries')).rows[0].n,0);
const privateSchema=(await db.query("select has_schema_privilege('anon','orbisy_release_20261006','USAGE') as access")).rows[0];
assert.equal(privateSchema.access,false);
await assert.rejects(db.exec(sql)); await db.exec('rollback');
await db.close();
for(const drift of ["alter table leads add column unexpected text", "update drizzle.__drizzle_migrations set hash='wrong' where id=2"]){
 const broken=await fixture(); await broken.exec(drift);
 await assert.rejects(broken.exec(sql),/Schema drift|Migration history/);
 await broken.exec('rollback');
 assert.equal((await broken.query("select to_regclass('public.pricing_entries') as pricing")).rows[0].pricing,null);
 assert.equal((await broken.query("select exists(select 1 from pg_namespace where nspname='orbisy_release_20261006') as backup")).rows[0].backup,false);
 assert.equal((await broken.query('select count(*)::int as n from drizzle.__drizzle_migrations')).rows[0].n,3);
 await broken.close();
}
console.log('PASS: migration/journal reconciliation preserves rows and RLS, restricts recovery copies, rejects repeats/schema drift/history drift atomically.');
