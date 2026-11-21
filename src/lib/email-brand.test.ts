import {describe, expect, it} from "vitest";
import {load} from "cheerio";
import {renderBrandedEmail} from "./email-brand";

describe("Branded automation emails", () => {
  it("uses the exact short link, multiline postal footer, and linked existing logo with a readable text alternative", () => {
    const email = renderBrandedEmail({subject:"A project follow-up", body:"Hi Sam,\n\nReply when convenient.", postalAddress:"123 Example St\r\nExample City, IL 60000", stopUrl:"https://www.orbisy.com/api/followups/unsubscribe?token=example.signature"});
    const $ = load(email.html);
    const stop = $("a").filter((_, element) => $(element).text() === "Stop These Follow Ups");
    expect(stop.length).toBe(1);
    expect(stop.attr("href")).toBe("https://www.orbisy.com/email-preferences?token=example.signature");
    expect($("body").text()).not.toContain("example.signature");
    expect(email.html).toContain("123 Example St<br>Example City, IL 60000");
    expect($("img").attr("src")).toBe("https://www.orbisy.com/orbisy-horizontal-color.png");
    expect($("img").parent().attr("href")).toBe("https://www.orbisy.com/");
    expect($("img").attr("alt")).toBeTruthy();
    expect(email.text).toContain("123 Example St\nExample City, IL 60000");
    expect(email.text).toContain("Stop These Follow Ups: https://www.orbisy.com/email-preferences?token=");
  });
  it("escapes submitted content, titles, and postal text while keeping HTTPS admin links usable", () => {
    const {html} = renderBrandedEmail({subject:'<img src=x onerror="bad()">', body:'Hi <script>bad()</script>\nhttps://www.orbisy.com/admin-portal/leads/example\n<img src=x>\njavascript:bad()', postalAddress:"<b>Example address</b>"});
    const $ = load(html);
    expect($("script").length).toBe(0);
    expect($("img").length).toBe(1);
    expect($("a[href^='javascript:']").length).toBe(0);
    expect($("a[href='https://www.orbisy.com/admin-portal/leads/example']").length).toBe(1);
    expect($("body").text()).toContain("<script>bad()</script>");
    expect($("a").filter((_, e) => $(e).text() === "Stop These Follow Ups").length).toBe(0);
  });
});
