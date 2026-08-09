import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { contactSubmissions, leads } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import { notifySubmission } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/spam";
import { recordsRequestSchema } from "@/lib/validation";

const CONSENT_VERSION = "privacy-2026-08-08";
const supportedTypes = ["hauler-request", "restaurant-request", "general-request"] as const;
type SupportedType = (typeof supportedTypes)[number];

export async function POST(request: Request, context: { params: Promise<{ type: string }> }) {
  const { type } = await context.params;
  if (!supportedTypes.includes(type as SupportedType)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  if (request.headers.get("content-length") && Number(request.headers.get("content-length")) > 16_000) return NextResponse.json({ message: "Request is too large." }, { status: 413 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
  const parsed = recordsRequestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ message: "Please review the highlighted information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });

  try {
    const allowed = await checkRateLimit(request, { namespace: `submission:${type}`, limit: 5, windowSeconds: 3600 });
    if (!allowed) return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
    if (!(await verifyTurnstile(parsed.data.turnstileToken))) return NextResponse.json({ message: "Spam protection could not verify this request." }, { status: 400 });

    const data = parsed.data;
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const existing = data.submissionToken ? await tx.select({ id: contactSubmissions.id }).from(contactSubmissions).where(eq(contactSubmissions.idempotencyKey, data.submissionToken)).limit(1) : [];
      if (existing[0]) return { duplicate: true };
      const submissionType = type.replace("-", "_") as "hauler_request" | "restaurant_request" | "general_request";
      const [submission] = await tx.insert(contactSubmissions).values({
        type: submissionType, name: data.name, businessName: data.businessName,
        email: data.email.toLowerCase(), websiteUrl: data.websiteUrl, phone: data.phone,
        role: data.role, audience: data.audience, serviceArea: data.serviceArea,
        locationCount: data.locationCount, currentRecordProcess: data.currentRecordProcess,
        primaryChallenge: data.primaryChallenge, pilotInterest: data.pilotInterest,
        idempotencyKey: data.submissionToken ?? crypto.randomUUID(), consentVersion: CONSENT_VERSION,
      }).returning({ id: contactSubmissions.id });

      const mappedProspectType = data.audience === "hauler" ? "grease_hauler" : data.audience === "restaurant" ? "restaurant_operator" : "other";
      await tx.insert(leads).values({
        submissionId: submission.id, businessName: data.businessName, contactName: data.name,
        email: data.email.toLowerCase(), phone: data.phone, websiteUrl: data.websiteUrl,
        prospectType: mappedProspectType, serviceTerritory: data.serviceArea,
        accountCountEstimate: data.locationCount, currentRecordProcess: data.currentRecordProcess,
        primaryChallenge: data.primaryChallenge, pilotInterest: data.pilotInterest,
        sourceName: `Inbound ${data.audience} request`, status: "new_inbound",
        priority: data.audience === "hauler" ? 100 : data.audience === "restaurant" ? 80 : 70,
      });
      return { duplicate: false };
    });

    if (!result.duplicate) void notifySubmission(type, data.businessName);
    return NextResponse.json({ message: result.duplicate ? "This request was already received." : "Thanks — your request was received. Typical response times are within two business days." });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "DATABASE_UNAVAILABLE";
    return NextResponse.json({ message: unavailable ? "The request form is not configured yet. Please call (224) 323-6231 or email info@orbisy.com." : "We could not save your request. Please try again." }, { status: unavailable ? 503 : 500 });
  }
}
