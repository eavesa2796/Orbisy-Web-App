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
  catch { return NextResponse.json({ message: "Worker run could not be completed." }, { status: 500 }); }
}
