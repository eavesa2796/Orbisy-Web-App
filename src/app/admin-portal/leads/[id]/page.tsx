import { notFound } from "next/navigation";
import Link from "next/link";
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
  const isInboundDraft = lead.status === "new_inbound" || Boolean(data.draft && !data.draft.auditRunId);
  const auditBriefAvailable = Boolean(data.phaseFiveRun && data.verifiedFindings.length);
  const selectedFindingIds = new Set(
    data.draft?.auditRunId === data.phaseFiveRun?.id
      ? data.draft.selectedFindingIds
      : data.verifiedFindings.slice(0, 2).map((finding) => finding.id),
  );
  const firstFinding = data.verifiedFindings[0];
  const relevantContext = `${lead.businessName} is ${lead.industry || lead.category ? `listed as ${lead.industry || lead.category}` : "a growing business"}${lead.location || lead.city ? ` in ${lead.location || [lead.city, lead.state].filter(Boolean).join(", ")}` : ""}.`;
  const whyItMayMatter = "These verified website observations may create friction for visitors trying to understand the business or make contact.";
  const suggestedImprovement = firstFinding?.suggestedImprovement || "Address the verified observation with a focused, maintainable website improvement.";
  const recommendedNextAction = "Review the business context, personalize the language, and send only after a final suppression check.";
  const draftBody = `Hello,\n\nWhile reviewing ${lead.businessName}'s public website, I noticed a verified opportunity that may be worth a closer look.\n\n${suggestedImprovement}\n\nIf it would be useful, I would be happy to discuss a focused next step.\n\nBest,\nAnthony\nOrbisy`;

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading"><div><p className="eyebrow">Lead record</p><h1>{lead.businessName}</h1><p>{lead.contactName || "Contact not identified"} · {lead.email || "No email"}</p></div></header>
      <section className="admin-grid">
        <article className="admin-card">
          <h2>Lead details</h2>
          <dl className="detail-list">
            <div><dt>Website</dt><dd>{lead.websiteUrl ? <a href={lead.websiteUrl} rel="noreferrer" target="_blank">{lead.websiteUrl}</a> : lead.websiteState === "not_listed" ? "No website listed by source" : "Unknown"}</dd></div>
            <div><dt>Industry</dt><dd>{lead.industry || lead.category || "—"}</dd></div>
            <div><dt>Location</dt><dd>{[lead.city, lead.state].filter(Boolean).join(", ") || lead.location || "—"}</dd></div>
            <div><dt>Public phone</dt><dd>{lead.phone || "—"}</dd></div>
            <div><dt>Source</dt><dd>{lead.sourceName}</dd></div>
            <div><dt>Source identifier</dt><dd>{lead.sourceIdentifier || "—"}</dd></div>
            <div><dt>Import batch</dt><dd>{lead.importBatchId ? <a href={`/admin-portal/imports/${lead.importBatchId}`}>{lead.importBatchId}</a> : "Manual or inbound"}</dd></div>
            <div><dt>Discovered</dt><dd>{lead.dateDiscovered?.toLocaleDateString() || "—"}</dd></div>
          </dl>
          {lead.status === "suppressed" ? (
            <p className="notice">This lead is suppressed. Its status cannot be changed from the general pipeline form.</p>
          ) : (
            <form action={updateLeadAction.bind(null, id)} className="admin-form single-column">
              <label>Status<select name="status" defaultValue={lead.status}>{leadStatusValues.filter((status) => status !== "suppressed").map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
              <label>Follow-up<input type="datetime-local" name="followUpAt" defaultValue={lead.followUpAt ? lead.followUpAt.toISOString().slice(0, 16) : ""} /></label>
              <label>Note<textarea name="note" rows={3} /></label>
              <button className="button button-primary" type="submit">Save changes</button>
            </form>
          )}
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
        <div className="card-heading">
          <div><p className="eyebrow">Manual use only</p><h2>{auditBriefAvailable ? "Phase 5 outreach brief" : "Inbound response draft"}</h2></div>
          {data.draft?.readyForManualUse && data.draft.status === "approved" && (
            <div className="copy-actions"><CopyButton label="Copy subject" value={data.draft.subject} /><CopyButton label="Copy body" value={data.draft.body} /></div>
          )}
        </div>
        <p className="notice">Orbisy never sends this automatically. Confirm the business context, use only verified observations, check suppression status, and copy approved language into your own email client.</p>
        {data.draft?.status === "stale" && <p className="notice warning-notice">This brief became stale when its audit review changed. Complete the audit review again, then review and approve this brief again.</p>}
        {data.draft?.status === "blocked" && <p className="notice error-text">This brief is blocked because the lead is suppressed.</p>}

        {auditBriefAvailable && data.phaseFiveRun ? (
          <form action={saveDraftAction.bind(null, id)} className="admin-form outreach-brief-form">
            <div className="span-two brief-source">
              <div><strong>Verified audit source</strong><span>Only reviewed findings from the current Phase 5-ready audit can be selected.</span></div>
              <Link className="button button-secondary" href={`/admin-portal/audits/${data.phaseFiveRun.jobId}`}>View audit</Link>
            </div>
            <fieldset className="span-two finding-selector">
              <legend>Choose one or two verified findings</legend>
              {data.verifiedFindings.map((finding) => (
                <label className="finding-option" key={finding.id}>
                  <input name="findingId" type="checkbox" value={finding.id} defaultChecked={selectedFindingIds.has(finding.id)} />
                  <span><strong>{finding.category.replaceAll("_", " ")} · {finding.severity}</strong>{finding.administratorExplanation || finding.originalExplanation}</span>
                </label>
              ))}
            </fieldset>
            <label className="span-two">Relevant context<textarea name="relevantContext" required rows={3} defaultValue={data.draft?.relevantContext || relevantContext} /></label>
            <label className="span-two">Why the verified findings may matter<textarea name="whyItMayMatter" required rows={3} defaultValue={data.draft?.whyItMayMatter || whyItMayMatter} /></label>
            <label className="span-two">Suggested improvement<textarea name="suggestedImprovement" required rows={3} defaultValue={data.draft?.suggestedImprovement || suggestedImprovement} /></label>
            <label className="span-two">Personalization notes<textarea name="personalizationNotes" rows={3} defaultValue={data.draft?.personalizationNotes || ""} placeholder="Add only details you have personally confirmed." /></label>
            <label className="span-two">Recommended next action<textarea name="recommendedNextAction" required rows={2} defaultValue={data.draft?.recommendedNextAction || recommendedNextAction} /></label>
            <label>Subject<input name="subject" required defaultValue={data.draft?.subject || `A website observation for ${lead.businessName}`} /></label>
            <label className="span-two">Draft language <span className="field-help">Review before external use.</span><textarea name="body" required rows={10} defaultValue={data.draft?.body || draftBody} /></label>
            <label className="checkbox span-two"><input type="checkbox" name="ready" defaultChecked={data.draft?.readyForManualUse && data.draft.status === "approved"} /> I verified the selected findings, reviewed every statement, and approve this brief for manual use.</label>
            <button className="button button-primary" type="submit">Save outreach brief</button>
          </form>
        ) : isInboundDraft && lead.status !== "suppressed" ? (
          <form action={saveDraftAction.bind(null, id)} className="admin-form">
            <label>Subject<input name="subject" required defaultValue={data.draft?.subject} /></label>
            <label>Verified observation 1<input name="observationOne" required defaultValue={data.draft?.verifiedObservations[0]} /></label>
            <label className="span-two">Verified observation 2<input name="observationTwo" defaultValue={data.draft?.verifiedObservations[1]} /></label>
            <label className="span-two">Draft body<textarea name="body" required rows={8} defaultValue={data.draft?.body} /></label>
            <label className="checkbox span-two"><input type="checkbox" name="ready" defaultChecked={data.draft?.readyForManualUse} /> I manually verified the observations and reviewed this draft.</label>
            <button className="button button-primary" type="submit">Save draft</button>
          </form>
        ) : (
          <div className="empty-state compact-empty"><h3>Not ready for outbound drafting</h3><p>Complete and verify a qualifying deep audit first. Inbound requests can still receive a manually reviewed response without an audit.</p></div>
        )}
      </section>

      <section className="admin-grid">
        <article className="admin-card">
          <h2>Record manual contact</h2>
          {lead.status === "suppressed" ? <p className="notice">Contact cannot be recorded for a suppressed lead.</p> : (
            <form action={recordContactAction.bind(null, id)} className="admin-form single-column">
              <label>Channel<select name="channel"><option value="email">Email</option><option value="phone">Phone</option><option value="linkedin">LinkedIn</option><option value="other">Other</option></select></label>
              <label>Contacted at<input type="datetime-local" name="contactedAt" required /></label>
              <label>Notes<textarea name="notes" rows={3} /></label>
              <button className="button button-secondary" type="submit">Record contact</button>
            </form>
          )}
          {data.attempts.map((attempt) => <p className="history-line" key={attempt.id}><strong>{attempt.channel}</strong> · {format(attempt.contactedAt)} {attempt.notes && `— ${attempt.notes}`}</p>)}
        </article>
        <article className="admin-card danger-card">
          <h2>Suppress lead</h2>
          {lead.status === "suppressed" ? (
            <p>This lead is suppressed and cannot be treated as eligible for outreach.</p>
          ) : (
            <>
              <p>Suppression prevents this lead from being treated as eligible for outreach.</p>
              <form action={suppressLeadAction.bind(null, id)} className="admin-form single-column">
                <label>Reason<textarea name="reason" required rows={3} /></label>
                <button className="button button-danger" type="submit">Suppress lead</button>
              </form>
            </>
          )}
        </article>
      </section>
    </AdminShell>
  );
}
