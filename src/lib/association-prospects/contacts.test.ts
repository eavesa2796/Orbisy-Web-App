import { describe, expect, it } from "vitest";
import { discoverBusinessContactPages, extractPublicContacts, mergePublicContacts, sameContactHost } from "./contacts";

describe("public organization contacts", () => {
  const source = "https://association.test/contact";
  it("normalizes plain phone text, tel links, email links and organization JSON-LD", () => {
    const html = `
      <p>Call (312) 555-0100<br>Fax: (312) 555-0199</p>
      <a href="tel:+1-312-555-0100">Call our office</a>
      <a href="mailto:INFO@association.test?subject=Hello">Email us</a>
      <p>No-reply@association.test</p>
      <script type="application/ld+json">{"@graph":[
        {"@type":"Person","email":"personal@association.test"},
        {"@type":"Organization","contactPoint":{"@type":"ContactPoint","telephone":"+1 773-555-0101","email":"membership@association.test"}}
      ]}</script>
    `;
    expect(extractPublicContacts(html, source)).toEqual([
      { type: "phone", value: "+13125550100", sourceUrl: source },
      { type: "phone", value: "+17735550101", sourceUrl: source },
      { type: "email", value: "info@association.test", sourceUrl: source },
      { type: "email", value: "membership@association.test", sourceUrl: source },
    ]);
  });

  it("keeps the parent office's footer and organization schema out of a chapter record", () => {
    const html = `<main><p>Chapter office: (312)555-0101</p><footer>parent@association.test</footer></main>
      <footer>info@association.test</footer>
      <script type="application/ld+json">{"@type":"Organization","email":"national@association.test"}</script>`;
    expect(extractPublicContacts(html, source, true)).toEqual([{ type: "phone", value: "+13125550101", sourceUrl: source }]);
  });

  it("limits contact discovery to public links on the same host, skips files and deduplicates", () => {
    const html = `<a href="https://outside.test/contact">Contact</a>
      <a href="https://chapter.association.test/contact">Contact</a>
      <a href="/account/contact">Contact</a><a href="/contact.pdf">Contact</a>
      <a href="/contact/?utm_source=footer">Contact Us</a><a href="/contact/#footer">Contact Us</a>
      <a href="/get-in-touch">Get in touch</a><a href="/contact-office">Contact</a>`;
    expect(discoverBusinessContactPages(html, "https://association.test/")).toEqual([
      "https://association.test/contact/", "https://association.test/get-in-touch",
    ]);
    expect(sameContactHost(new URL("https://other.wordpress.com/"), new URL("https://association.wordpress.com/"))).toBe(false);
  });

  it("preserves contact sources when combining pages and puts the general inbox first", () => {
    const phone = { type: "phone" as const, value: "+13125550100", sourceUrl: source };
    const email = { type: "email" as const, value: "info@association.test", sourceUrl: source };
    const otherEmail = { type: "email" as const, value: "events@association.test", sourceUrl: "https://association.test/" };
    expect(mergePublicContacts([otherEmail, phone], [email, phone])).toEqual([phone, email, otherEmail]);
  });
});
