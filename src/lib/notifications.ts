import "server-only";

export async function notifySubmission(type: string, businessName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !from || !to) return { configured: false };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New Orbisy ${type.replaceAll("_", " ")} request`,
        text: `A new request from ${businessName} was saved. Sign in to the Orbisy administrator portal to review it.`,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return { configured: true, sent: response.ok };
  } catch {
    return { configured: true, sent: false };
  }
}
