import "server-only";

import { load } from "cheerio";

export type FindingDraft = {
  category: "mobile_usability" | "conversion_path_cta" | "performance" | "technical_seo" | "accessibility" | "reliability_security" | "manual_review_opportunity";
  findingType: string; explanation: string; evidence: Record<string, unknown>;
  affectedUrl: string; severity: "informational" | "low" | "medium" | "high";
  confidence: "low" | "medium" | "high"; suggestedImprovement: string;
};

const bounded = (value: string, maximum = 240) => value.replace(/\s+/g, " ").trim().slice(0, maximum);
function finding(input: FindingDraft) { return input; }

export function analyzeHtmlPage(url: string, html: string) {
  const $ = load(html); const results: FindingDraft[] = [];
  const title = bounded($("title").first().text());
  const description = bounded($("meta[name='description' i]").attr("content") || "");
  const headings = $("h1,h2,h3,h4,h5,h6").toArray().map((node) => Number(node.tagName.slice(1)));
  const h1Count = $("h1").length;
  const viewport = bounded($("meta[name='viewport' i]").attr("content") || "");
  const links = $("a[href]").toArray();
  const contactPath = links.some((node) => /contact|book|schedule|appointment|get in touch/i.test(`${$(node).text()} ${$(node).attr("href")}`));
  const contactSignals = {
    contactLink: contactPath,
    phoneLink: $("a[href^='tel:']").length > 0,
    emailLink: $("a[href^='mailto:']").length > 0,
    form: $("form").length > 0,
  };
  const images = $("img").toArray(); const missingAlt = images.filter((node) => $(node).attr("alt") === undefined).length;
  const emptyAlt = images.filter((node) => $(node).attr("alt") === "").length;
  const ids = $("[id]").toArray().map((node) => $(node).attr("id") || "").filter(Boolean);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].slice(0, 10);
  const controls = $("input:not([type='hidden']),select,textarea").toArray();
  const unlabeled = controls.filter((node) => {
    const id = $(node).attr("id");
    const matchingLabel = id && $("label[for]").toArray().some((label) => $(label).attr("for") === id);
    return !$(node).attr("aria-label") && !$(node).attr("aria-labelledby") && !$(node).closest("label").length && !matchingLabel;
  }).length;
  const headingJump = headings.some((level, index) => index > 0 && level > headings[index - 1]! + 1);
  const insecureForm = $("form[action^='http:']").length > 0;
  const documentLanguage = bounded($("html").attr("lang") || "");
  const inaccessibleInteractive = $("a,button").toArray().filter((node) => {
    const name = bounded(`${$(node).attr("aria-label") || ""} ${$(node).text()} ${$(node).find("img[alt]").attr("alt") || ""}`);
    return !name;
  }).length;
  const obviousFixedWidth = $("[style]").toArray().filter((node) => /(?:^|;)\s*(?:min-)?width\s*:\s*(?:[7-9]\d\d|\d{4,})px/i.test($(node).attr("style") || "")).length;
  const canonical = bounded($("link[rel='canonical' i]").attr("href") || "");
  const noindex = /(?:^|,)\s*noindex\b/i.test($("meta[name='robots' i]").attr("content") || "");

  if (!title) results.push(finding({ category: "technical_seo", findingType: "missing_page_title", explanation: "The inspected page has no non-empty HTML title.", evidence: { titlePresent: false }, affectedUrl: url, severity: "medium", confidence: "high", suggestedImprovement: "Add a concise, page-specific HTML title." }));
  if (!description) results.push(finding({ category: "technical_seo", findingType: "missing_meta_description", explanation: "The inspected page has no non-empty meta description.", evidence: { metaDescriptionPresent: false }, affectedUrl: url, severity: "low", confidence: "high", suggestedImprovement: "Add a factual page-specific meta description." }));
  if (h1Count === 0) results.push(finding({ category: "technical_seo", findingType: "missing_primary_heading", explanation: "No H1 primary heading was detected in the inspected HTML.", evidence: { h1Count }, affectedUrl: url, severity: "medium", confidence: "high", suggestedImprovement: "Add one descriptive primary heading." }));
  if (!viewport || !/width\s*=\s*device-width/i.test(viewport)) results.push(finding({ category: "mobile_usability", findingType: "missing_or_invalid_viewport", explanation: "A viewport declaration using device width was not detected.", evidence: { viewport: bounded(viewport, 120) || null }, affectedUrl: url, severity: "medium", confidence: "high", suggestedImprovement: "Add a valid responsive viewport meta tag and manually test responsive layouts." }));
  if (obviousFixedWidth) results.push(finding({ category: "mobile_usability", findingType: "obvious_fixed_width", explanation: `${obviousFixedWidth} inline style declarations use an obviously wide fixed pixel width.`, evidence: { obviousFixedWidthCount: obviousFixedWidth }, affectedUrl: url, severity: "medium", confidence: "medium", suggestedImprovement: "Replace rigid wide containers with responsive sizing and verify the layout manually." }));
  if (!Object.values(contactSignals).some(Boolean)) results.push(finding({ category: "conversion_path_cta", findingType: "missing_contact_path", explanation: "No contact link, phone link, email link, booking link, or form was detected.", evidence: contactSignals, affectedUrl: url, severity: "high", confidence: "medium", suggestedImprovement: "Provide a clear, accessible way for visitors to contact or book with the business." }));
  if (missingAlt > 0) results.push(finding({ category: "accessibility", findingType: "images_missing_alt", explanation: `${missingAlt} of ${images.length} inspected image elements had no alt attribute.`, evidence: { imagesInspected: images.length, missingAlt, emptyAlt }, affectedUrl: url, severity: "medium", confidence: "high", suggestedImprovement: "Add useful alt text to informative images and intentional empty alt text to decorative images." }));
  if (!documentLanguage) results.push(finding({ category: "accessibility", findingType: "missing_document_language", explanation: "The document does not declare a language on the HTML element.", evidence: { documentLanguage: null }, affectedUrl: url, severity: "low", confidence: "high", suggestedImprovement: "Declare the primary document language with the HTML lang attribute." }));
  if (inaccessibleInteractive) results.push(finding({ category: "accessibility", findingType: "interactive_elements_without_names", explanation: `${inaccessibleInteractive} link or button elements had no detectable accessible name.`, evidence: { inaccessibleInteractive }, affectedUrl: url, severity: "high", confidence: "medium", suggestedImprovement: "Give every interactive control a clear visible or programmatic accessible name." }));
  if (unlabeled > 0) results.push(finding({ category: "accessibility", findingType: "form_controls_without_labels", explanation: `${unlabeled} of ${controls.length} inspected form controls had no detectable label association.`, evidence: { controlsInspected: controls.length, unlabeled }, affectedUrl: url, severity: "high", confidence: "medium", suggestedImprovement: "Associate each form control with a visible label or an appropriate accessible name." }));
  if (headingJump) results.push(finding({ category: "accessibility", findingType: "heading_order_warning", explanation: "The inspected heading sequence skips at least one level.", evidence: { headingLevels: headings.slice(0, 30) }, affectedUrl: url, severity: "low", confidence: "medium", suggestedImprovement: "Use a logical heading hierarchy without skipped levels where practical." }));
  if (duplicateIds.length) results.push(finding({ category: "accessibility", findingType: "duplicate_ids", explanation: "Duplicate HTML id values were detected.", evidence: { duplicateIds }, affectedUrl: url, severity: "medium", confidence: "high", suggestedImprovement: "Make every HTML id unique within the document." }));
  if (insecureForm) results.push(finding({ category: "reliability_security", findingType: "insecure_form_action", explanation: "A form action explicitly targets an unencrypted HTTP URL.", evidence: { insecureActionCount: $("form[action^='http:']").length }, affectedUrl: url, severity: "high", confidence: "high", suggestedImprovement: "Submit forms only to validated HTTPS endpoints." }));
  if (noindex) results.push(finding({ category: "technical_seo", findingType: "page_noindex", explanation: "The inspected page contains a robots noindex directive.", evidence: { noindex: true }, affectedUrl: url, severity: "medium", confidence: "high", suggestedImprovement: "Confirm whether this page should be indexed and remove noindex only when appropriate." }));
  return { findings: results, evidence: { title: title || null, descriptionPresent: Boolean(description), h1Count, viewport: viewport || null, contactSignals, imagesInspected: images.length, missingAlt, emptyAlt, controlsInspected: controls.length, unlabeledControls: unlabeled, structuredDataCount: $("script[type='application/ld+json']").length, canonical: canonical || null, documentLanguage: documentLanguage || null, inaccessibleInteractive, obviousFixedWidth, noindex } };
}
