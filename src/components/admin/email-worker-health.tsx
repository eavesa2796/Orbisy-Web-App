import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { followupMessages, followupSettings, outreachMessages, outreachSettings } from "@/lib/db/schema";

const chicagoTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago",
});

async function loadHealth() {
  try {
    const db = getDb();
    const [inquiry, outreach, inquiryQueue, outreachQueue] = await Promise.all([
      db.select({ lastRun: followupSettings.lastWorkerAt, lastSync: followupSettings.gmailSyncedAt, error: followupSettings.gmailError, sending: followupSettings.sendingEnabled }).from(followupSettings).where(eq(followupSettings.id, "main")),
      db.select({ lastRun: outreachSettings.lastWorkerAt, lastSync: outreachSettings.gmailSyncedAt, error: outreachSettings.gmailError, sending: outreachSettings.sendingEnabled }).from(outreachSettings).where(eq(outreachSettings.id, "main")),
      db.select({ count: count() }).from(followupMessages).where(eq(followupMessages.status, "approved")),
      db.select({ count: count() }).from(outreachMessages).where(eq(outreachMessages.status, "approved")),
    ]);
    return [
      { label: "Website inquiry follow-ups", href: "/admin-portal/followups", state: inquiry[0], pending: inquiryQueue[0]?.count ?? 0 },
      { label: "Reviewed outreach", href: "/admin-portal/outreach", state: outreach[0], pending: outreachQueue[0]?.count ?? 0 },
    ];
  } catch {
    return null;
  }
}

export async function EmailWorkerHealth() {
  const rows = await loadHealth();
  const now = new Date().getTime();
  if (!rows) return <section className="admin-card"><h2>Email worker health</h2><p>Mailbox status is temporarily unavailable.</p></section>;

    return (
      <section className="admin-card" aria-labelledby="email-worker-health">
        <h2 id="email-worker-health">Email worker health</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>Workflow</th><th>Mailbox sync</th><th>Last worker run (Chicago)</th><th>Last successful sync (Chicago)</th><th>Approved messages</th></tr></thead>
          <tbody>{rows.map(({ label, href, state, pending }) => {
            const stale = !state?.lastSync || now - state.lastSync.getTime() >= 15 * 60_000;
            return <tr key={href}>
              <th scope="row"><Link href={href}>{label}</Link></th>
              <td>
                <strong>{state?.error ? "Needs attention" : stale ? "Sync is stale or has never run" : "Sync is current"}</strong>
                <p>{state?.sending ? "Sending switch on" : "Sending switch off"}</p>
                {state?.error && <p>{state.error}</p>}
              </td>
              <td>{state?.lastRun ? chicagoTime.format(state.lastRun) : "No run recorded"}</td>
              <td>{state?.lastSync ? chicagoTime.format(state.lastSync) : "No sync recorded"}</td>
              <td>{pending}</td>
            </tr>;
          })}</tbody>
        </table></div>
      </section>
    );
}
