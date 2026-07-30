import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { contactSubmissions, leads } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import { notifySubmission } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/spam";
import {
  homepageReviewSchema,
  projectRequestSchema,
} from "@/lib/validation";

const CONSENT_VERSION = "privacy-2026-07-30";

export async function POST(
  request: Request,
  context: { params: Promise<{ type: string }> },
) {
  const { type } = await context.params;
  if (type !== "homepage-review" && type !== "project-request") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > 16_000
  ) {
    return NextResponse.json({ message: "Request is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed =
    type === "homepage-review"
      ? homepageReviewSchema.safeParse(payload)
      : projectRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Please review the highlighted information.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const allowed = await checkRateLimit(request, {
      namespace: `submission:${type}`,
      limit: 5,
      windowSeconds: 3600,
    });
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    if (!(await verifyTurnstile(parsed.data.turnstileToken))) {
      return NextResponse.json(
        { message: "Spam protection could not verify this request." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const review =
      type === "homepage-review" ? homepageReviewSchema.parse(data) : null;
    const project =
      type === "project-request" ? projectRequestSchema.parse(data) : null;
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const existing = data.submissionToken
        ? await tx
            .select({ id: contactSubmissions.id })
            .from(contactSubmissions)
            .where(
              eq(contactSubmissions.idempotencyKey, data.submissionToken),
            )
            .limit(1)
        : [];
      if (existing[0]) return { duplicate: true };

      const [submission] = await tx
        .insert(contactSubmissions)
        .values({
          type: type === "homepage-review" ? "homepage_review" : "project_request",
          name: data.name,
          businessName: data.businessName,
          email: data.email.toLowerCase(),
          websiteUrl: data.websiteUrl,
          primaryGoal: review?.primaryGoal,
          websiteConcern: review?.websiteConcern,
          serviceNeeded: project?.serviceNeeded,
          projectDescription: project?.projectDescription,
          timeline: project?.timeline,
          budgetRange: project?.budgetRange,
          idempotencyKey: data.submissionToken ?? crypto.randomUUID(),
          consentVersion: CONSENT_VERSION,
        })
        .returning({ id: contactSubmissions.id });

      await tx.insert(leads).values({
        submissionId: submission.id,
        businessName: data.businessName,
        contactName: data.name,
        email: data.email.toLowerCase(),
        websiteUrl: data.websiteUrl,
        sourceName:
          type === "homepage-review"
            ? "Inbound homepage review"
            : "Inbound project request",
        status: "new_inbound",
        priority: type === "homepage-review" ? 100 : 90,
      });

      return { duplicate: false };
    });

    if (!result.duplicate) {
      void notifySubmission(type, data.businessName);
    }

    return NextResponse.json({
      message: result.duplicate
        ? "This request was already received."
        : "Thanks — your request was received. Anthony will review it soon.",
    });
  } catch (error) {
    const unavailable =
      error instanceof Error && error.message === "DATABASE_UNAVAILABLE";
    return NextResponse.json(
      {
        message: unavailable
          ? "The request form is not configured yet. Please email info@orbisy.com."
          : "We could not save your request. Please try again.",
      },
      { status: unavailable ? 503 : 500 },
    );
  }
}
