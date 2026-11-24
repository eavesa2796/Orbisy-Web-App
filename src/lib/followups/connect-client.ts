export async function getGmailAuthorizationUrl(path: "/api/admin/followups/gmail/start" | "/api/admin/outreach/gmail/start" = "/api/admin/followups/gmail/start"): Promise<string> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {Accept: "application/json"},
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Could not reach Orbisy to start the Gmail connection. Check your connection and try again.");
  }

  if (response.status === 401) {
    throw new Error("Your administrator session has expired. Sign in again, then connect Gmail.");
  }
  if (response.status === 409) {
    throw new Error("Gmail connection settings are not ready. Check the production Google credentials and encryption key, then redeploy.");
  }
  if (!response.ok) {
    throw new Error("Orbisy could not start the Gmail connection. Try again shortly.");
  }

  try {
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("authorizationUrl" in data) || typeof data.authorizationUrl !== "string") {
      throw new Error("Invalid authorization response");
    }
    const url = new URL(data.authorizationUrl);
    if (url.origin !== "https://accounts.google.com" || url.pathname !== "/o/oauth2/v2/auth" || url.username || url.password) {
      throw new Error("Invalid authorization destination");
    }
    return url.toString();
  } catch {
    throw new Error("Orbisy returned an unexpected Google connection response. Refresh the page and try again.");
  }
}
