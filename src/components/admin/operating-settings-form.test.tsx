import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/app/admin-portal/settings/actions", () => ({
  updateSettingsAction: vi.fn(),
}));
import { OperatingSettingsForm } from "./operating-settings-form";
import { exampleOperatingSettings } from "@/lib/admin-settings-example";
import { adminSettingHelp } from "@/lib/admin-setting-help";
afterEach(cleanup);
describe("Grouped operating settings", () => {
  it("preserves every editable setting in form submission even when groups are collapsed", () => {
    const { container } = render(
      <OperatingSettingsForm settings={exampleOperatingSettings} />,
    );
    const form = container.querySelector("form")!;
    const names = Array.from(
      form.querySelectorAll<HTMLInputElement>(
        "input[name],select[name],textarea[name]",
      ),
    ).map((el) => el.name);
    expect(names.length).toBe(Object.keys(adminSettingHelp).length);
    expect(new Set(names).size).toBe(names.length);
    const data = new FormData(form);
    for (const name of names) {
      const field = form.elements.namedItem(name) as HTMLInputElement;
      expect(field.closest("label")).not.toBeNull();
      expect(field).toHaveAttribute("aria-describedby", `setting-help-${name}`);
      expect(container.querySelector(`#setting-help-${name}`)).not.toBeNull();
      const value =
        exampleOperatingSettings[name as keyof typeof exampleOperatingSettings];
      if (typeof value === "boolean") expect(data.has(name)).toBe(value);
      else
        expect(data.get(name)).toBe(
          Array.isArray(value) ? value.join("\n") : String(value),
        );
    }
    expect(
      container.querySelectorAll("details:not([open])").length,
    ).toBeGreaterThan(0);
  });
  it("prevents example settings from being submitted", () => {
    const { container } = render(
      <OperatingSettingsForm settings={exampleOperatingSettings} readOnly />,
    );
    expect(
      screen.getByRole("button", { name: "Save settings" }),
    ).toBeDisabled();
    expect(
      container.querySelector('input[name="preflightEnabled"]'),
    ).toBeDisabled();
    expect(
      new FormData(container.querySelector("form")!).has("targetIndustries"),
    ).toBe(false);
  });
});
