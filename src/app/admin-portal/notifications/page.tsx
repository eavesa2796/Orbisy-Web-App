import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getInquiryNotifications } from "@/lib/data/inquiries";
import { retryNotificationAction } from "./actions";
export default async function Page() {
  const admin = await requireAdmin();
  let rows: Awaited<ReturnType<typeof getInquiryNotifications>> | null = null;
  try {
    rows = await getInquiryNotifications();
  } catch {}
  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Saved inquiries</p>
          <h1>Notifications</h1>
          <p>
            Email status is separate from inquiry storage. A failed notification
            never removes the saved lead.
          </p>
        </div>
      </header>
      <section className="admin-card">
        <p className="notice">
          Retries use a stable provider idempotency key. Wait at least one
          minute between attempts. An interrupted attempt becomes retryable
          after ten minutes. The provider’s deduplication window is 24 hours;
          review its email log before retrying an ambiguous timeout after that
          window. “Sent” means accepted by the provider, not confirmed inbox
          delivery. Showing up to 100 records, with notifications needing
          attention first.
        </p>
        {rows === null ? (
          <p>
            Connect the database and apply migration 0008 to review
            notifications.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Inquiry</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Last attempt / error</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(
                  ({ notification: n, businessName, service, leadId }) => (
                    <tr key={n.id}>
                      <td>
                        {leadId ? (
                          <Link href={`/admin-portal/leads/${leadId}`}>
                            {businessName}
                          </Link>
                        ) : (
                          businessName
                        )}
                        <span>{service ?? "Website review"}</span>
                      </td>
                      <td>
                        <span className="status-pill">
                          {n.status.replaceAll("_", " ")}
                        </span>
                        {n.sentAt && <span>{n.sentAt.toLocaleString()}</span>}
                      </td>
                      <td>{n.attempts}</td>
                      <td>
                        {n.lastAttemptAt?.toLocaleString() ?? "Not attempted"}
                        <span>{n.lastError}</span>
                      </td>
                      <td>
                        {n.status !== "sent" && (
                          <form action={retryNotificationAction}>
                            <input
                              type="hidden"
                              name="notificationId"
                              value={n.id}
                            />
                            <button
                              className="button button-secondary"
                              type="submit"
                            >
                              Retry notification
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p>
                No notification records yet. Existing inquiries predate this
                workflow and remain in Leads.
              </p>
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
