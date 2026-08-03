// @vitest-environment node
import { describe, expect, it } from "vitest";
import { analyzeHtmlPage } from "./analyzers";

describe("objective HTML analyzers", () => {
  it("detects bounded objective opportunities", () => {
    const result = analyzeHtmlPage("https://example.com/", `<!doctype html><html><body>
      <h2>Services</h2><h4>Details</h4><img src="a.jpg"><img src="decorative.jpg" alt="">
      <form action="http://example.com/send"><input id="email"></form>
      <div id="same"></div><span id="same"></span></body></html>`);
    const types = result.findings.map((item) => item.findingType);
    expect(types).toEqual(expect.arrayContaining([
      "missing_page_title", "missing_meta_description", "missing_primary_heading",
      "missing_or_invalid_viewport", "images_missing_alt",
      "form_controls_without_labels", "heading_order_warning", "duplicate_ids", "insecure_form_action",
    ]));
    expect(result.evidence).toMatchObject({ imagesInspected: 2, missingAlt: 1, emptyAlt: 1 });
  });

  it("does not invent findings when objective signals are present", () => {
    const result = analyzeHtmlPage("https://example.com/", `<!doctype html><html lang="en"><head>
      <title>Example</title><meta name="description" content="Example page">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="canonical" href="https://example.com/"><script type="application/ld+json">{}</script>
      </head><body><h1>Example</h1><a href="/contact">Contact</a><img src="a.jpg" alt="Team">
      <form action="https://example.com/send"><label for="email">Email</label><input id="email"></form></body></html>`);
    expect(result.findings).toEqual([]);
    expect(result.evidence).toMatchObject({ structuredDataCount: 1, canonical: "https://example.com/" });
  });
});
