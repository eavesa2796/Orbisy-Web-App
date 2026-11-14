import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicNavigation } from "@/components/public-navigation";
import { serviceNavigation } from "@/lib/public-navigation";
let mobile = false;
beforeEach(() => {
  mobile = false;
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function setup() {
  return render(
    <PublicNavigation
      services={serviceNavigation}
    />,
  );
}
describe("Public navigation disclosures", () => {
  it("provides all service and industry destinations as normal links", () => {
    const { container } = setup();
    for (const item of serviceNavigation)
      expect(container.querySelector(`a[href="${item.href}"]`)).toBeTruthy();
    expect(container.querySelectorAll("summary")).toHaveLength(1);
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });
  it("opens one panel at a time and restores focus when Escape dismisses it", async () => {
    const { container } = setup();
    const panels = container.querySelectorAll("details");
    panels[0].open = true;
    fireEvent(panels[0], new Event("toggle"));
    panels[0].querySelector("a")!.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(panels[0].open).toBe(false));
    expect(document.activeElement).toBe(panels[0].querySelector("summary"));
  });
  it("dismisses panels on outside interaction and on navigation", () => {
    const { container } = setup();
    const panel = container.querySelector("details")!;
    panel.open = true;
    fireEvent.pointerDown(document.body);
    expect(panel.open).toBe(false);
    panel.open = true;
    fireEvent.click(screen.getByRole("link", { name: /^About$/ }));
    expect(panel.open).toBe(false);
  });
});

describe("Mobile navigation drawer", () => {
  it("opens a modal, locks background scrolling, and dismisses with Escape", () => {
    mobile = true;
    const { container } = setup();
    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    const panel = container.querySelector("dialog")!;
    expect(panel.open).toBe(false);
    fireEvent.click(trigger);
    expect(panel.open).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe("mobile-navigation-title");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(panel.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);
  });
  it("closes after following a link, close button, cancel, or backdrop", () => {
    mobile = true;
    const { container } = setup();
    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    const panel = container.querySelector("dialog")!;
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("link", { name: /^About$/ }));
    expect(panel.open).toBe(false);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Close navigation menu" }));
    expect(panel.open).toBe(false);
    fireEvent.click(trigger);
    fireEvent(panel, new Event("cancel", { cancelable: true }));
    expect(panel.open).toBe(false);
    fireEvent.click(trigger);
    fireEvent.click(panel, { clientX: -1, clientY: 10 });
    expect(panel.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });
});
