import Link from "next/link";
import { Mail, Layers3, ClipboardList } from "lucide-react";
import type { clientWorkspaces } from "@/lib/db/schema";
type Context = Pick<
  typeof clientWorkspaces.$inferSelect,
  | "id"
  | "contactName"
  | "contactEmail"
  | "contactRole"
  | "cms"
  | "platforms"
  | "vendorContacts"
  | "accessNotes"
  | "currentScope"
  | "supportScope"
  | "supportCapacity"
  | "supportBoundaries"
>;
export function WorkspaceSummary({
  client,
  editHref,
}: {
  client: Context;
  editHref?: string;
}) {
  return (
    <section
      className="workspace-context"
      aria-labelledby="workspace-context-heading"
    >
      <div className="workspace-context-heading">
        <div>
          <p className="eyebrow">People · Systems · Agreed work</p>
          <h2 id="workspace-context-heading">Client context, at a glance.</h2>
        </div>
        <Link
          className="text-link"
          href={editHref ?? `/admin-portal/clients/${client.id}/edit`}
        >
          Update details →
        </Link>
      </div>
      <div className="workspace-summary-grid">
        <article className="admin-card">
          <h3>
            <Mail size={18} aria-hidden="true" /> Contact & access
          </h3>
          <dl>
            <div>
              <dt>Primary contact</dt>
              <dd>
                {client.contactName || "Not recorded"}
                {client.contactRole && <small>{client.contactRole}</small>}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {client.contactEmail ? (
                  <a href={`mailto:${client.contactEmail}`}>
                    {client.contactEmail}
                  </a>
                ) : (
                  "Not recorded"
                )}
              </dd>
            </div>
            <div>
              <dt>Vendor contacts / account owner</dt>
              <dd className="workspace-preserve">
                {client.vendorContacts || "Not recorded"}
              </dd>
            </div>
          </dl>
          <details className="workspace-context-details">
            <summary>Access references</summary>
            <p className="workspace-preserve">
              {client.accessNotes ||
                "No non-secret access references recorded."}
            </p>
            <p className="field-help">
              Use password-manager references, not passwords or tokens.
            </p>
          </details>
        </article>
        <article className="admin-card">
          <h3>
            <Layers3 size={18} aria-hidden="true" /> Systems & project scope
          </h3>
          <dl>
            <div>
              <dt>Website platform / CMS</dt>
              <dd>{client.cms || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Membership, event, and other systems</dt>
              <dd className="workspace-preserve">
                {client.platforms || "Not recorded"}
              </dd>
            </div>
          </dl>
          <details
            className="workspace-context-details"
            open={!!client.currentScope && client.currentScope.length <= 300}
          >
            <summary>Current project scope</summary>
            <p className="workspace-preserve">
              {client.currentScope || "No project scope recorded yet."}
            </p>
          </details>
        </article>
        <article className="admin-card">
          <h3>
            <ClipboardList size={18} aria-hidden="true" /> Support arrangements
          </h3>
          <dl>
            <div>
              <dt>Routine care / support</dt>
              <dd className="workspace-preserve">
                {client.supportScope || "Not agreed / recorded"}
              </dd>
            </div>
            <div>
              <dt>Development capacity</dt>
              <dd>{client.supportCapacity || "Not agreed / recorded"}</dd>
            </div>
          </dl>
          <details className="workspace-context-details">
            <summary>Boundaries & larger work</summary>
            <p className="workspace-preserve">
              {client.supportBoundaries ||
                "No support boundaries recorded yet."}
            </p>
          </details>
        </article>
      </div>
    </section>
  );
}
