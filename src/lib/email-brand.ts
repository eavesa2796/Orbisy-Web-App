const homeUrl = "https://www.orbisy.com/";
const logoUrl = `${homeUrl}orbisy-horizontal-color.png`;

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]!);
}

// Only absolute HTTPS URLs become links. Everything else remains escaped text.
function bodyHtml(value: string) {
  return value.split(/(https:\/\/[^\s<>"']+)/g).map(part =>
    part.startsWith("https://")
      ? `<a href="${escapeHtml(part)}" style="color:#08758a;text-decoration:underline;overflow-wrap:anywhere">${escapeHtml(part)}</a>`
      : escapeHtml(part).replace(/\r?\n/g, "<br>"),
  ).join("");
}

export function preferencePageUrl(stopUrl: string) {
  const url = new URL(stopUrl);
  url.pathname = "/email-preferences";
  return url.href;
}

/** Render only before the first delivery attempt; retries reuse the stored payload. */
export function renderBrandedEmail({subject, body, postalAddress, stopUrl}: {
  subject: string; body: string; postalAddress?: string; stopUrl?: string | null;
}) {
  const address = (postalAddress || "").replace(/\r\n/g, "\n").trim();
  const preferences = stopUrl ? preferencePageUrl(stopUrl) : null;
  const text = [body, "Orbisy LLC", address, ...(preferences ? [`Stop These Follow Ups: ${preferences}`] : []), homeUrl].filter(Boolean).join("\n\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#eef3f6;font-family:Arial,Helvetica,sans-serif;color:#172c3d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef3f6"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #d4e1e8;border-radius:16px;overflow:hidden">
<tr><td style="padding:22px 28px;background-color:#091625;border-bottom:3px solid #5be7cf"><span style="font-size:13px;letter-spacing:2px;font-weight:bold;color:#91f5df">ORBISY</span></td></tr>
<tr><td style="padding:30px 28px;font-size:16px;line-height:1.7;overflow-wrap:anywhere">${bodyHtml(body)}</td></tr>
<tr><td style="padding:24px 28px;background-color:#091625;color:#c1cfdd;font-size:13px;line-height:1.8">
<p style="margin:0 0 12px"><strong style="color:#ffffff">Orbisy LLC</strong>${address ? `<br>${escapeHtml(address).replace(/\n/g, "<br>")}` : ""}</p>
${preferences ? `<p style="margin:0 0 20px"><a href="${escapeHtml(preferences)}" style="color:#91f5df;text-decoration:underline">Stop These Follow Ups</a></p>` : ""}
<a href="${homeUrl}" style="display:inline-block"><img src="${logoUrl}" width="150" height="70" alt="Orbisy — visit our website" style="display:block;width:150px;height:70px;border:0"></a>
</td></tr></table></td></tr></table></body></html>`;
  return {text, html};
}
