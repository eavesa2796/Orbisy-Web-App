import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { CopyButton } from "@/components/admin/copy-button";
import { recordContactAction, saveDraftAction, suppressLeadAction, updateLeadAction } from "@/app/admin-portal/actions";
import { requireAdmin } from "@/lib/auth";
import { getLead } from "@/lib/data/admin";
import { leadStatusValues } from "@/lib/validation";

const format = (date: Date | null) => date ? date.toLocaleString() : "—";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = await getLead(id);
  if (!data.lead) notFound();
  const lead = data.lead;

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading"><div><p className="eyebrow">Lead record</p><h1>{lead.businessName}</h1><p>{lead.contactName || "Contact not identified"} · {lead.email || "No email"}</p></div></header>
      <section className="admin-grid">
        <article className="admin-card">
          <h2>Lead details</h2>
          <dl className="detail-list"><div><dt>Website</dt><dd>{lead.websiteUrl ? <a href={lead.websiteUrl} rel="noreferrer" target="_blank">{lead.websiteUrl}</a> : "No website listed"}</dd></div><div><dt>Category</dt><dd>{lead.category || "—"}</dd></div><div><dt>Location</dt><dd>{lead.location || "—"}</dd></div><div><dt>Source</dt><dd>{lead.sourceName}</dd></div></dl>
          <form action={updateLeadAction.bind(null, id)} className="admin-form single-column">
            <label>Status<select name="status" defaultValue={lead.status}>{leadStatusValues.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
            <label>Follow-up<input type="datetime-local" name="followUpAt" defaultValue={lead.followUpAt ? lead.followUpAt.toISOString().slice(0, 16) : ""} /></label>
            <label>Note<textarea name="note" rows={3} /></label>
            <button className="button button-primary" type="submit">Save changes</button>
          </form>
        </article>
        <article className="admin-card">
          <h2>Notes & history</h2>
          <ul className="timeline">
            {data.notes.map((note) => <li key={note.id}><strong>Note</strong><span>{format(note.createdAt)}</span><p>{note.body}</p></li>)}
            {data.history.map((event) => <li key={event.id}><strong>{event.toStatus.replaceAll("_", " ")}</strong><span>{format(event.createdAt)}</span>{event.note && <p>{event.note}</p>}</li>)}
          </ul>
          {!data.notes.length && !data.history.length && <p className="muted">No history yet.</p>}
        </article>
      </section>

      <section className="admin-card">
        <div className="card-heading"><div><p className="eyebrow">Manual use only</p><h2>Outreach draft</h2></div>{data.draft && <div className="copy-actions"><CopyButton label="Copy subject" value={data.draft.subject} /><CopyButton label="Copy body" value={data.draft.body} /></div>}</div>
        <p className="notice">Orbisy never sends this automatically. Verify every observation, check suppression status, then copy it into your own email client.</p>
        <form action={saveDraftAction.bind(null, id)} className="admin-form">
          <label>Subject<input name="subject" required defaultValue={data.draft?.subject} /></label>
          <label>Verified observation 1<input name="observationOne" required defaultValue={data.draft?.verifiedObservations[0]} /></label>
          <label className="span-two">Verified observation 2<input name="observationTwo" defaultValue={data.draft?.verifiedObservations[1]} /></label>
          <label className="span-two">Draft body<textarea name="body" required rows={8} defaultValue={data.draft?.body} /></label>
          <label className="checkbox span-two"><input type="checkbox" name="ready" defaultChecked={data.draft?.readyForManualUse} /> I manually verified the observations and reviewed this draft.</label>
          <button className="button button-primary" type="submit">Save draft</button>
        </form>
      </section>

      <section className="admin-grid">
        <article className="admin-card">
          <h2>Record manual contact</h2>
          <form action={recordContactAction.bind(null, id)} className="admin-form single-column">
            <label>Channel<select name="channel"><option value="email">Email</option><option value="phone">Phone</option><option value="linkedin">LinkedIn</option><option value="other">Other</option></select></label>
            <label>Contacted at<input type="datetime-local" name="contactedAt" required /></label>
            <label>Notes<textarea name="notes" rows={3} /></label>
            <button className="button button-secondary" type="submit">Record contact</button>
          </form>
          {data.attempts.map((attempt) => <p className="history-line" key={attempt.id}><strong>{attempt.channel}</strong> · {format(attempt.contactedAt)} {attempt.notes && `— ${attempt.notes}`}</p>)}
        </article>
        <article className="admin-card danger-card">
          <h2>Suppress lead</h2>
          <p>Suppression prevents this lead from being treated as eligible for outreach.</p>
          <form action={suppressLeadAction.bind(null, id)} className="admin-form single-column">
            <label>Reason<textarea name="reason" required rows={3} /></label>
            <button className="button button-danger" type="submit">Suppress lead</button>
          </form>
        </article>
      </section>
    </AdminShell>
  );
}
