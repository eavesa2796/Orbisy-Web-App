// @vitest-environment-options {"url":"https://www.orbisy.com/"}
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PublicForm } from "./public-form";
import { GOOGLE_SCRIPT_ID, setGoogleConsent, suspendGoogleAnalytics } from "@/lib/analytics/google";
function commands() { return ((window as Window & {
    dataLayer?: Array<ArrayLike<unknown>>;
}).dataLayer ?? []).map(c => Array.from(c)); }
beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); suspendGoogleAnalytics(); document.getElementById(GOOGLE_SCRIPT_ID)?.remove(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function fill() { fireEvent.change(screen.getByLabelText("Name"), { target: { value: "QA" } }); fireEvent.change(screen.getByLabelText("Association / organization name"), { target: { value: "Example association" } }); fireEvent.change(screen.getByLabelText("Email"), { target: { value: "qa@example.test" } }); fireEvent.change(screen.getByLabelText("Service needed"), { target: { value: "Association websites" } }); fireEvent.change(screen.getByLabelText("What problem would you like to solve?"), { target: { value: "Private inquiry text" } }); fireEvent.click(screen.getByRole("checkbox")); }
it("emits one GA4 generate_lead only after a confirmed saved inquiry and never calls the retired collector", async () => {
    expect(location.hostname).toBe("www.orbisy.com");
    setGoogleConsent("granted");
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ saved: false, message: "Retry" }), { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ saved: true, duplicate: false }), { status: 200 }));
    vi.stubGlobal("fetch", request);
    const beacon = vi.fn();
    vi.stubGlobal("navigator", { sendBeacon: beacon });
    const { container } = render(<PublicForm type="project-request"/>);
    fill();
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByRole("alert");
    expect(commands().filter(c => c[0] === "event" && c[1] === "generate_lead")).toHaveLength(0);
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByText("Request received");
    const lead = commands().filter(c => c[0] === "event" && c[1] === "generate_lead");
    expect(lead).toHaveLength(1);
    expect(lead[0][2]).toMatchObject({ send_to: "G-DZQMLKQDTE", form_type: "project_request" });
    expect(JSON.stringify(lead)).not.toMatch(/qa@example|Private inquiry text|sessionId|organization|businessName/);
    expect(beacon).not.toHaveBeenCalled();
    expect(request.mock.calls.every(call => String(call[0]).startsWith("/api/submissions/"))).toBe(true);
    expect(window.sessionStorage.getItem("orbisy_analytics_session")).toBeNull();
});
it("saves an inquiry without permission and emits no Google lead event", async () => { setGoogleConsent("denied"); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ saved: true, duplicate: false }), { status: 200 }))); const { container } = render(<PublicForm type="project-request"/>); fill(); fireEvent.submit(container.querySelector("form")!); await screen.findByText("Request received"); expect(commands().filter(c => c[0] === "event" && c[1] === "generate_lead")).toHaveLength(0); });
