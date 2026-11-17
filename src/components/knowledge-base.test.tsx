import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("@/components/public-site-shell", () => ({ PublicHeader: () => <header>Site header</header>, PublicFooter: () => <footer>Site footer</footer> }));
import { KnowledgeBody } from "./knowledge-body";
import { KnowledgeIndex, KnowledgeArticleView } from "./knowledge-base";
import { previewKnowledgeArticles } from "@/lib/knowledge-base-starters";
afterEach(cleanup);
it("renders text safely without interpreting HTML or scripts", () => { const { container } = render(<KnowledgeBody body={'## A heading\n\n<script>alert(1)</script>\n\n- First\n- Second'}/>); expect(container.querySelector("script")).toBeNull(); expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument(); expect(screen.getAllByRole("listitem")).toHaveLength(2); });
describe("Knowledge browse and articles", () => {
    it("provides searchable labeled controls, filtered content, and empty-state recovery", () => { render(<KnowledgeIndex articles={previewKnowledgeArticles()} query="nothing-matches"/>); expect(screen.getByRole("searchbox", { name: "Search the knowledge base" })).toHaveValue("nothing-matches"); expect(screen.getByRole("heading", { name: "No articles match yet" })).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/knowledge-base"); });
    it("links the article contents to actual headings and keeps the consultation path", () => { const { container } = render(<KnowledgeArticleView article={previewKnowledgeArticles()[0]}/>); for (const link of container.querySelectorAll('a[href^="#section-"]'))
        expect(container.querySelector(link.getAttribute("href")!)).toBeTruthy(); expect(screen.getByRole("link", { name: "Discuss your project →" })).toHaveAttribute("href", "/#contact"); });
});
