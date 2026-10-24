import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PublicNavigation } from "@/components/public-navigation";
import { serviceNavigation, industryNavigation } from "@/lib/public-navigation";
afterEach(cleanup);
function setup() {
  return render(
    <PublicNavigation
      services={serviceNavigation}
      industries={industryNavigation}
    />,
  );
}
describe("Public navigation disclosures", () => {
  it("provides all service and industry destinations as normal links", () => {
    const { container } = setup();
    for (const item of [...serviceNavigation, ...industryNavigation])
      expect(container.querySelector(`a[href="${item.href}"]`)).toBeTruthy();
    expect(container.querySelectorAll("summary")).toHaveLength(2);
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });
  it("opens one panel at a time and restores focus when Escape dismisses it", async () => {
    const { container } = setup();
    const panels = container.querySelectorAll("details");
    panels[0].open = true;
    fireEvent(panels[0], new Event("toggle"));
    panels[1].open = true;
    fireEvent(panels[1], new Event("toggle"));
    await waitFor(() => expect(panels[0].open).toBe(false));
    panels[1].querySelector("a")!.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(panels[1].open).toBe(false);
    expect(document.activeElement).toBe(panels[1].querySelector("summary"));
  });
  it("dismisses panels on outside interaction and on navigation", () => {
    const { container } = setup();
    const panel = container.querySelector("details")!;
    panel.open = true;
    fireEvent.pointerDown(document.body);
    expect(panel.open).toBe(false);
    panel.open = true;
    fireEvent.click(screen.getByRole("link", { name: /^Pricing$/ }));
    expect(panel.open).toBe(false);
  });
});
