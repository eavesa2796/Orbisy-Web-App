import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { recordContactAction, suppressLeadAction, updateLeadAction } from "@/app/admin-portal/actions";
import { requireAdmin } from "@/lib/auth";
import { getLead } from "@/lib/data/admin";
import { leadStatusValues } from "@/lib/validation";

const format = (date: Date | null) => date ? date.toLocaleString() : "—";

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ contactRecorded?: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { contactRecorded } = await searchParams;
  const data = await getLead(id);
  if (!data.lead) notFound();
  const lead = data.lead;

  return <AdminShell email={admin.email}>
    <header className="admin-heading"><div><p className="eyebrow">Prospect record</p><h1>{lead.businessName}</h1><p>{lead.contactName || "Contact not identified"} · {lead.email || lead.phone || "No contact details"}</p></div><span className="status-pill">{lead.status.replaceAll("_", " ")}</span></header>
    {contactRecorded === "1" && <p className="notice" role="status">Contact recorded and the prospect moved to contacted. Orbisy did not send a message.</p>}
    <section className="admin-grid">
      <article className="admin-card"><h2>Company and opportunity</h2><dl className="detail-list">
        <div><dt>Prospect type</dt><dd>{lead.prospectType.replaceAll("_", " ")}</dd></div>
        <div><dt>Website</dt><dd>{lead.websiteUrl ? <a href={lead.websiteUrl} rel="noreferrer" target="_blank">{lead.websiteUrl}</a> : "—"}</dd></div>
        <div><dt>Phone</dt><dd>{lead.phone || "—"}</dd></div>
        <div><dt>Headquarters</dt><dd>{[lead.city, lead.state].filter(Boolean).join(", ") || lead.location || "—"}</dd></div>
        <div><dt>Service territory</dt><dd>{lead.serviceTerritory || "—"}</dd></div>
        <div><dt>Restaurant accounts</dt><dd>{lead.accountCountEstimate || "—"}</dd></div>
        <div><dt>Record process</dt><dd>{lead.currentRecordProcess || "—"}</dd></div>
        <div><dt>Pilot interest</dt><dd>{lead.pilotInterest || "—"}</dd></div>
        <div><dt>Primary challenge</dt><dd>{lead.primaryChallenge || "—"}</dd></div>
        <div><dt>Source</dt><dd>{lead.sourceName}</dd></div>
      </dl></article>
      <article className="admin-card"><h2>Next action</h2>{lead.status === "suppressed" ? <p className="notice">This prospect is suppressed. Its status cannot be changed here.</p> : <form action={updateLeadAction.bind(null, id)} className="admin-form single-column">
        <label>Pipeline stage<select name="status" defaultValue={lead.status}>{leadStatusValues.filter((status) => status !== "suppressed").map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
        <label>Follow-up date and time<input type="datetime-local" name="followUpAt" defaultValue={lead.followUpAt ? lead.followUpAt.toISOString().slice(0, 16) : ""} /></label>
        <label>Call outcome / next-step note<textarea name="note" rows={5} placeholder="Decision-maker, current process, pain point, objection, promised follow-up, and next action" /></label>
        <button className="button button-primary" type="submit">Save next action</button>
      </form>}</article>
    </section>
    <section className="admin-card"><div className="card-heading"><div><p className="eyebrow">Workflow review prep</p><h2>Questions to have answered</h2></div></div><ul className="check-list">
      <li><div><strong>Record flow</strong><span>How do tickets, photos, and manifests move from the driver to the office and customer?</span></div></li>
      <li><div><strong>Request volume</strong><span>How often do restaurant customers ask for old or missing records, and who responds?</span></div></li>
      <li><div><strong>Customer fit</strong><span>Which 5–10 accounts would represent a useful 30-day pilot?</span></div></li>
      <li><div><strong>Authorization</strong><span>Who can approve record access, customer communication, and pilot scope?</span></div></li>
      <li><div><strong>Success measure</strong><span>What result would justify a broader rollout: fewer requests, better completeness, or stronger customer delivery?</span></div></li>
    </ul></section>
    <section className="admin-grid">
      <article className="admin-card"><h2>Record a contact attempt</h2>{lead.status === "suppressed" ? <p className="notice">Contact cannot be recorded for a suppressed prospect.</p> : <form action={recordContactAction.bind(null, id)} className="admin-form single-column"><label>Channel<select name="channel"><option value="phone">Phone</option><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="other">Other</option></select></label><label>Contacted at<input type="datetime-local" name="contactedAt" required /></label><label>What happened?<textarea name="notes" rows={4} placeholder="Reached decision-maker, voicemail, gatekeeper, objection, or next step" /></label><button className="button button-secondary" type="submit">Record contact</button></form>}{data.attempts.map((attempt) => <p className="history-line" key={attempt.id}><strong>{attempt.channel}</strong> · {format(attempt.contactedAt)} {attempt.notes && `— ${attempt.notes}`}</p>)}</article>
      <article className="admin-card"><h2>Notes and pipeline history</h2><ul className="timeline">{data.notes.map((note) => <li key={note.id}><strong>Note</strong><span>{format(note.createdAt)}</span><p>{note.body}</p></li>)}{data.history.map((event) => <li key={event.id}><strong>{event.toStatus.replaceAll("_", " ")}</strong><span>{format(event.createdAt)}</span></li>)}</ul>{!data.notes.length && !data.history.length && <p className="muted">No history yet.</p>}</article>
    </section>
    <section className="admin-card danger-card"><h2>Suppress prospect</h2>{lead.status === "suppressed" ? <p>This prospect is suppressed and cannot be treated as eligible for outreach.</p> : <form action={suppressLeadAction.bind(null, id)} className="admin-form single-column"><label>Reason<textarea name="reason" required rows={3} /></label><button className="button button-danger" type="submit">Suppress prospect</button></form>}</section>
  </AdminShell>;
}
