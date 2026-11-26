import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { validWorkerSecret } from "@/lib/preflight/worker-auth";
import { runWorker } from "@/lib/preflight/service";
import { runAssociationProspectWorker } from "@/lib/association-prospects/worker";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const secret = authorization?.startsWith("Bearer ") ? authorization.slice(7) : request.headers.get("x-preflight-worker-secret");
  if (!validWorkerSecret(secret)) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try {
    const workerId = `http-${randomUUID()}`;
    const [preflight, associationProspects] = await Promise.all([
      runWorker(workerId),
      process.env.ASSOCIATION_PROSPECTING_ENABLED === "true"
        ? runAssociationProspectWorker(workerId)
        : Promise.resolve({ claimed: 0, processed: 0, disabled: true }),
    ]);
    return NextResponse.json({ preflight, associationProspects });
  }
  catch (error) {
    const value = error as { name?: unknown; code?: unknown } | null;
    console.error("[preflight-worker] run failed", {
      name: typeof value?.name === "string" ? value.name.slice(0, 80) : "UnknownError",
      code: typeof value?.code === "string" ? value.code.slice(0, 80) : undefined,
    });
    return NextResponse.json({ message: "Worker run could not be completed." }, { status: 500 });
  }
}
