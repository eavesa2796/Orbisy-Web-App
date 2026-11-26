import { randomUUID } from "node:crypto";
import { runAssociationProspectWorker } from "@/lib/association-prospects/worker";
import { validWorkerSecret } from "@/lib/preflight/worker-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const secret = process.env.ASSOCIATION_WORKER_SECRET;

  if (!secret || !validWorkerSecret(token, secret)) {
    return Response.json({ message: "Unauthorized." }, { status: 401, headers });
  }

  if (process.env.ASSOCIATION_PROSPECTING_ENABLED !== "true") {
    return Response.json({ claimed: 0, processed: 0, disabled: true }, { headers });
  }

  try {
    const result = await runAssociationProspectWorker(`association-${randomUUID()}`);
    return Response.json(result, { headers });
  } catch {
    console.error("[association-prospect-worker] could not claim or finalize a job");
    return Response.json({ message: "Worker run could not be completed." }, { status: 500, headers });
  }
}
