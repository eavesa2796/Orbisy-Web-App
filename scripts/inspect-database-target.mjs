import { createHash } from "node:crypto";
import postgres from "postgres";
const connection = process.env.DATABASE_URL;
if (!connection) {
  console.error("DATABASE_URL is missing. No database target was contacted.");
  process.exit(1);
}
let url;
try {
  url = new URL(connection);
} catch {
  console.error("DATABASE_URL is not a valid connection URL.");
  process.exit(1);
}
const identity = `${url.hostname}:${url.port || "5432"}${url.pathname}`;
console.log(
  JSON.stringify({
    host: url.hostname,
    port: url.port || "5432",
    database: url.pathname.slice(1),
    targetFingerprint: createHash("sha256")
      .update(identity)
      .digest("hex")
      .slice(0, 16),
  }),
);
const sql = postgres(connection, {
  max: 1,
  prepare: false,
  connect_timeout: 5,
});
try {
  const [target] =
    await sql`select current_database() as database, current_user as role, to_regclass('drizzle.__drizzle_migrations')::text as migration_table`;
  console.log(JSON.stringify(target));
  if (target.migration_table) {
    const [last] =
      await sql`select created_at as last_migration_timestamp from drizzle.__drizzle_migrations order by created_at desc limit 1`;
    console.log(JSON.stringify(last || { last_migration_timestamp: null }));
  }
} catch {
  console.error(
    "Target inspection failed. Check the connection and permissions; no migration was applied.",
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
