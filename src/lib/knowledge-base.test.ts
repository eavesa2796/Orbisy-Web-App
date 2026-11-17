import { describe, expect, it } from "vitest";
import { articleDraftSchema, publishedArticle, filterKnowledge, knowledgePassages } from "./knowledge-base";
import { previewKnowledgeArticles } from "./knowledge-base-starters";
const articles = previewKnowledgeArticles();
describe("Knowledge content boundaries", () => {
    it("finds content using all words and applies the selected topic", () => { expect(filterKnowledge(articles, "STAFF editing", "websites").length).toBeGreaterThan(0); expect(filterKnowledge(articles, "single sign-on", "members")).toEqual([]); expect(filterKnowledge(articles, "not-a-real-question")).toEqual([]); });
    it("rejects unsafe slugs and invalid dates and only publishes reviewed, complete content", () => { const base = { ...articles[0], id: "", version: 0, intent: "publish", internalNotes: "private" }; expect(articleDraftSchema.safeParse({ ...base, slug: "../admin" }).success).toBe(false); expect(articleDraftSchema.safeParse({ ...base, reviewedOn: "2026-02-30" }).success).toBe(false); const draft = articleDraftSchema.parse(base); expect(() => publishedArticle({ ...draft, reviewedOn: "" }, 1)).toThrow(); expect(() => publishedArticle({ ...draft, reviewedOn: "2099-01-01" }, 1)).toThrow(); expect(() => publishedArticle({ ...draft, summary: "short" }, 1)).toThrow(); expect(publishedArticle(draft, 1)).not.toHaveProperty("internalNotes"); });
    it("provides revisioned, cited passages without editor metadata or private notes", () => { const passages = knowledgePassages(articles[0]); expect(passages.length).toBeGreaterThan(3); expect(passages[0].source).toMatch(/^\/knowledge-base\/planning-an-association-website#section-1$/); expect(passages[0].id).toContain(":r1:"); expect(JSON.stringify(passages)).not.toMatch(/internalNotes|updatedBy/); });
});
