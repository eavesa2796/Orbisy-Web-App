import { NextResponse } from "next/server";
import { analyticsEventSchema } from "@/lib/analytics";
import { analyticsEvents } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { lt } from "drizzle-orm";

export async function POST(request: Request) {
  if (process.env.ANALYTICS_ENABLED === "false") {
    return new NextResponse(null, { status: 204 });
  }

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > 4_000
  ) {
    return new NextResponse(null, { status: 413 });
  }

  try {
    const parsed = analyticsEventSchema.safeParse(await request.json());
    if (!parsed.success) return new NextResponse(null, { status: 400 });

    const allowed = await checkRateLimit(request, {
      namespace: "analytics",
      limit: 120,
      windowSeconds: 60,
    });
    if (!allowed) return new NextResponse(null, { status: 429 });

    const db = getDb();
    await db.insert(analyticsEvents).values(parsed.data);
    const retentionDays = Math.min(
      Math.max(Number(process.env.ANALYTICS_RETENTION_DAYS) || 90, 1),
      365,
    );
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000);
    await db.delete(analyticsEvents).where(lt(analyticsEvents.occurredAt, cutoff));
    return new NextResponse(null, { status: 202 });
  } catch {
    // Analytics must never interrupt the public experience.
    return new NextResponse(null, { status: 202 });
  }
}
