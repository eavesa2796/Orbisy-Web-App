import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { validWorkerSecret } from "@/lib/preflight/worker-auth";
import { runWorker } from "@/lib/preflight/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const secret = authorization?.startsWith("Bearer ") ? authorization.slice(7) : request.headers.get("x-preflight-worker-secret");
  if (!validWorkerSecret(secret)) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try { return NextResponse.json(await runWorker(`http-${randomUUID()}`)); }
  catch (error) {
    const value = error as { name?: unknown; code?: unknown } | null;
    console.error("[preflight-worker] run failed", {
      name: typeof value?.name === "string" ? value.name.slice(0, 80) : "UnknownError",
      code: typeof value?.code === "string" ? value.code.slice(0, 80) : undefined,
    });
    return NextResponse.json({ message: "Worker run could not be completed." }, { status: 500 });
  }
}
