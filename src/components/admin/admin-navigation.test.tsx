import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ pathname: "/admin-portal/clients/example/edit" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
import { AdminNavigation } from "./admin-navigation";
import { isAdminDestinationActive } from "@/lib/admin-navigation";
afterEach(cleanup);
describe("Administrator navigation", () => {
  it("identifies nested destinations without matching unrelated prefixes", () => {
    render(<AdminNavigation />);
    expect(screen.getByRole("link", {name: "Clients"})).toHaveAttribute("aria-current", "page");
    expect(isAdminDestinationActive("/admin-portal/clients-archive", "/admin-portal/clients")).toBe(false);
  });
  it("opens and closes the mobile disclosure with Escape and restores focus", () => {
    render(<AdminNavigation />);
    const button = screen.getByRole("button", {name: "Menu"});
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const link = screen.getByRole("link", {name: "Clients"});
    link.focus();
    fireEvent.keyDown(link, {key: "Escape"});
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
    fireEvent.click(button);
    fireEvent.click(link);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
  it("reveals supporting tools when visiting one and closes the menu on route change", () => {
    route.pathname = "/admin-portal/imports/example";
    const {rerender} = render(<AdminNavigation />);
    expect(screen.getByText("Supporting tools").closest("details")).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", {name: "Menu"}));
    route.pathname = "/admin-portal/dashboard";
    rerender(<AdminNavigation />);
    expect(screen.getByRole("button", {name: "Menu"})).toHaveAttribute("aria-expanded", "false");
  });
  it("keeps the client section active on the fictional edit screen", () => {
    render(<AdminNavigation reviewMode reviewView="edit" />);
    expect(screen.getByRole("link", {name: "Client preview"})).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", {name: "Pricing"})).not.toBeInTheDocument();
  });
});
