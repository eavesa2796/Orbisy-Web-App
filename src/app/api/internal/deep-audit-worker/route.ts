import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { runAuditWorker } from "@/lib/audits/service";
import { validDeepAuditWorkerSecret } from "@/lib/audits/worker-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const secret = authorization?.startsWith("Bearer ") ? authorization.slice(7) : request.headers.get("x-deep-audit-worker-secret");
  if (!validDeepAuditWorkerSecret(secret)) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try { return NextResponse.json(await runAuditWorker(`http-${randomUUID()}`)); }
  catch (error) {
    const value = error as { name?: unknown; code?: unknown } | null;
    console.error("[deep-audit-worker] run failed", { name: typeof value?.name === "string" ? value.name.slice(0, 80) : "UnknownError", code: typeof value?.code === "string" ? value.code.slice(0, 80) : undefined });
    return NextResponse.json({ message: "Worker run could not be completed." }, { status: 500 });
  }
}
