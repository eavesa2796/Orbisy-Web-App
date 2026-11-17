"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveKnowledgeAction, addKnowledgeStartersAction } from "@/app/admin-portal/knowledge-base/actions";
import type { knowledgeArticles } from "@/lib/db/schema";
import { knowledgeCategories } from "@/lib/knowledge-base";
import { KnowledgeBody } from "@/components/knowledge-body";
import "@/components/knowledge-base.css";
type Entry = typeof knowledgeArticles.$inferSelect;
export function AddKnowledgeStarters() { const [state, action, pending] = useActionState(addKnowledgeStartersAction, { success: false, message: "" }); return <form action={action}><button className="button button-secondary" disabled={pending}>{pending ? "Adding drafts…" : "Add six starter drafts"}</button><p role="status" aria-live="polite">{state.message}</p></form>; }
export function KnowledgeEditor({ entry, reviewMode = false }: {
    entry?: Entry;
    reviewMode?: boolean;
}) {
    const [state, action, pending] = useActionState(saveKnowledgeAction, { success: false, message: "" });
    const [body, setBody] = useState(entry?.body ?? "");
    const [title, setTitle] = useState(entry?.title ?? "");
    const [summary, setSummary] = useState(entry?.summary ?? "");
    return <div className="kb-editor"><form action={reviewMode ? undefined : action} onSubmit={reviewMode ? event => event.preventDefault() : undefined} className="admin-form">
 <input type="hidden" name="id" value={state.id ?? entry?.id ?? ""}/><input type="hidden" name="version" value={state.version ?? entry?.version ?? 0}/>
 <label className="span-two">Article title<input name="title" required minLength={3} maxLength={160} value={title} onChange={e => setTitle(e.target.value)}/></label>
 <label>Address slug<input name="slug" required minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={entry?.slug ?? ""} readOnly={!!entry?.published}/><span className="field-help">Lowercase words with hyphens. Locked after first publication to protect links.</span></label>
 <label>Topic<select name="category" defaultValue={entry?.category ?? "websites"}>{Object.entries(knowledgeCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
 <label className="span-two">Short summary<textarea name="summary" maxLength={350} rows={3} value={summary} onChange={e => setSummary(e.target.value)}/><span className="field-help">Shown in search results and social previews. Publishing requires at least 30 characters.</span></label>
 <label className="span-two">Article content<textarea name="body" maxLength={40000} rows={18} value={body} onChange={e => setBody(e.target.value)}/><span className="field-help">Separate paragraphs with a blank line. Start a heading with ## and a bullet with - followed by a space. HTML and embedded scripts are displayed as text. Publishing requires at least 150 characters.</span></label>
 <label>Content reviewed on<input type="date" name="reviewedOn" defaultValue={entry?.reviewedOn ?? ""} max={new Date().toISOString().slice(0, 10)}/><span className="field-help">Confirm accuracy before publishing. This date appears on the public article.</span></label>
 <label>Internal editorial notes<textarea name="internalNotes" maxLength={5000} rows={3} defaultValue={entry?.internalNotes ?? ""}/><span className="field-help">Private reminders only. Never included in public articles or future retrieval passages.</span></label>
 <div className="span-two kb-editor-actions"><button name="intent" value="save_draft" className="button button-secondary" disabled={pending || reviewMode}>{pending ? "Saving…" : "Save draft changes"}</button><button name="intent" value="publish" className="button" disabled={pending || reviewMode}>Publish this version</button>{entry?.published && <button name="intent" value="unpublish" className="button button-secondary" disabled={pending || reviewMode}>Unpublish article</button>}{entry && <button name="intent" value="archive" className="button button-secondary" disabled={pending || reviewMode}>Archive article</button>}</div>
 <p className="span-two notice">{reviewMode ? "Read-only design review: you can try the fields and content preview, but saves and publication are disabled." : "Save draft changes keeps the live version unchanged. Publish replaces it with this content. Unpublish or Archive hides it from visitors; neither deletes its record."}</p>
 <p className="span-two" role="status" aria-live="polite">{state.message}</p>{state.id && !entry && <Link href={`/admin-portal/knowledge-base/${state.id}`} className="text-link">Open saved article →</Link>}
 </form><details className="kb-draft-preview" open><summary>Preview current draft text</summary><p className="muted">Only this editor shows unsaved text. This preview does not publish anything.</p><h2>{title || "Article title"}</h2><p>{summary || "Your summary will appear here."}</p><KnowledgeBody body={body}/></details></div>;
}
