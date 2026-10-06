import { after, NextResponse } from "next/server";
import { saveInquiry } from "@/lib/inquiries";
import { deliverSubmissionNotification } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/spam";
import { homepageReviewSchema, projectRequestSchema } from "@/lib/validation";

export const maxDuration = 30;

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
    return NextResponse.json(
      { message: "Request is too large." },
      { status: 413 },
    );
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
    if (
      process.env.ANALYTICS_ENABLED === "false" ||
      request.headers.get("dnt") === "1" ||
      request.headers.get("sec-gpc") === "1"
    )
      data.attribution = undefined;
    const result = await saveInquiry(type, data);
    if (result.notificationId) {
      const notificationId = result.notificationId;
      after(async () => {
        try {
          await deliverSubmissionNotification(notificationId);
        } catch {
          console.error(
            "Orbisy notification worker failed; saved notification remains retryable",
            { notificationId },
          );
        }
      });
    }

    return NextResponse.json({
      saved: true,
      duplicate: result.duplicate,
      message: result.duplicate
        ? "This request was already received."
        : "Thanks — your request was received. Anthony will review it and reply by email about the next step.",
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
