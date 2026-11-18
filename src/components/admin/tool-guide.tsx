import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass } from "lucide-react";
import { adminToolGuides, type AdminToolKey } from "@/lib/admin-tool-guides";
export function ToolGuide({
  tool,
  expanded = false,
  preview = false,
}: {
  tool: AdminToolKey;
  expanded?: boolean;
  preview?: boolean;
}) {
  const guide = adminToolGuides[tool];
  return (
    <section
      className="admin-tool-guide"
      aria-label={`${guide.title} instructions`}
    >
      <div className="tool-guide-intro">
        <BookOpen size={20} aria-hidden="true" />
        <div>
          <p className="eyebrow">What this tool is for</p>
          <p>{guide.purpose}</p>
        </div>
        <span className={`tool-role role-${guide.role.toLowerCase()}`}>
          {guide.role}
        </span>
      </div>
      <p className="tool-fit">
        <strong>For Orbisy now:</strong> {guide.fit}
      </p>
      <details open={expanded}>
        <summary>How to use this tool & understand the results</summary>
        <div className="tool-guide-body">
          <div>
            <h2>Start here</h2>
            <ol>
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="tool-outcome">
              <strong>What you get:</strong> {guide.outcome}
            </p>
            <h3>When to skip it</h3>
            <p>{guide.skip}</p>
          </div>
          <div>
            <h3>Terms & decisions explained</h3>
            <dl>
              {guide.terms.map(([term, meaning]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </details>
      <Link
        className="tool-guide-directory"
        href={
          preview
            ? "/preview/tools#tool-directory"
            : "/admin-portal/tools#tool-directory"
        }
      >
        Compare all tools and their purpose{" "}
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
const supportingKeys: AdminToolKey[] = [
  "imports",
  "review",
  "preflight",
  "audits",
  "suppressions",
  "analytics",
  "settings",
];
export function ToolDirectory({ preview = false }: { preview?: boolean }) {
  const href = (key: AdminToolKey) =>
    preview ? `/preview/tools?tool=${key}` : adminToolGuides[key].href;
  return (
    <>
      <section
        className="tools-start admin-card"
        aria-labelledby="tools-start-heading"
      >
        <div>
          <p className="eyebrow">Choose a job, not a phase</p>
          <h2 id="tools-start-heading">
            Start with the work Orbisy needs today.
          </h2>
          <p>
            For association projects, the core workflow is inquiry →
            conversation → client workspace → discovery and delivery. The
            research tools below are optional.
          </p>
          <p className="tool-recommendation">
            <strong>Recommended now:</strong> prioritize client workspaces,
            inquiries, internal pricing, and sales reporting. Leave imports,
            checks, and audits aside unless you are deliberately researching
            prospects. Keep do-not-contact records when handling exclusions.
          </p>
        </div>
        <div className="tools-start-links">
          {(
            ["leads", "clients", "pricing", "notifications"] as AdminToolKey[]
          ).map((key) => (
            <Link key={key} href={href(key)}>
              <span>{adminToolGuides[key].title}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <section
        id="tool-directory"
        className="tool-directory"
        aria-labelledby="tool-directory-heading"
      >
        <div className="tool-directory-heading">
          <Compass size={23} aria-hidden="true" />
          <div>
            <p className="eyebrow">Keep, use occasionally, or leave aside</p>
            <h2 id="tool-directory-heading">What still serves Orbisy?</h2>
            <p>
              These are workflow recommendations, not a measurement of how often
              you use each tool. Existing tools and records remain available.
            </p>
          </div>
        </div>
        <div className="tool-directory-grid">
          {supportingKeys.map((key) => {
            const guide = adminToolGuides[key];
            return (
              <article className="admin-card tool-directory-card" key={key}>
                <span className={`tool-role role-${guide.role.toLowerCase()}`}>
                  {guide.role}
                </span>
                <h3>{guide.title}</h3>
                <p>{guide.purpose}</p>
                <p className="tool-card-fit">
                  <strong>Use it when</strong>{" "}
                  {key === "imports"
                    ? "you have a permitted association prospect list to organize."
                    : key === "review"
                      ? "an import contains uncertain matches."
                      : key === "preflight"
                        ? "you want an initial public-site check before deeper research."
                        : key === "audits"
                          ? "a limited evidence-backed website review will help discovery or outreach."
                          : key === "suppressions"
                            ? "you need to retain opt-outs or prospect exclusions."
                            : key === "analytics"
                              ? "you want a directional view of public-site use and inquiry activity."
                              : "you deliberately need to adjust prospecting rules or processing controls."}
                </p>
                <Link className="text-link" href={href(key)}>
                  Open {guide.title.toLowerCase()}{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
      <details className="admin-card tool-workflow">
        <summary>Optional prospect research: how the pieces connect</summary>
        <ol>
          <li>
            <strong>Add organizations.</strong> Enter a lead manually or import
            a permitted CSV; resolve uncertain duplicates.
          </li>
          <li>
            <strong>Run website checks.</strong> Select leads, queue checks, and
            review reachability and target-rule fit. This was called Phase 3.
          </li>
          <li>
            <strong>Review an audit.</strong> Separately queue eligible public
            websites, inspect evidence, and verify the findings. This was called
            Phase 4.
          </li>
          <li>
            <strong>Prepare a manual brief.</strong> If the review is ready,
            prepare and approve a draft on the lead. This was called Phase 5.
            Send separately and log any contact manually.
          </li>
        </ol>
        <p>
          No stage automatically sends outreach. You can serve association
          clients without running this sequence. It does not inspect private
          member systems or establish integration feasibility.
        </p>
        <p className="notice">
          <strong>Review the old targeting rules first.</strong> Local-industry
          and Chicago-area rules may not fit national associations. Check the
          saved settings before research; no target rules are changed by this
          guidance.
        </p>
      </details>
    </>
  );
}
