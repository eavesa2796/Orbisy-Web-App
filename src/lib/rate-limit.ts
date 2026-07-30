import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

type RateLimitOptions = {
  namespace: string;
  limit: number;
  windowSeconds: number;
};

function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SECRET ?? "orbisy-local"}:${address}`)
    .digest("hex")
    .slice(0, 40);
}

export async function checkRateLimit(
  request: Request,
  { namespace, limit, windowSeconds }: RateLimitOptions,
) {
  const key = `${namespace}:${requestFingerprint(request)}`;
  const db = getDb();
  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limit_buckets ("key", "count", "window_started_at")
    VALUES (${key}, 1, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN rate_limit_buckets."window_started_at" < NOW() - (${windowSeconds} * INTERVAL '1 second')
          THEN 1
        ELSE rate_limit_buckets."count" + 1
      END,
      "window_started_at" = CASE
        WHEN rate_limit_buckets."window_started_at" < NOW() - (${windowSeconds} * INTERVAL '1 second')
          THEN NOW()
        ELSE rate_limit_buckets."window_started_at"
      END
    RETURNING "count"
  `);

  return Number(result[0]?.count ?? limit + 1) <= limit;
}
