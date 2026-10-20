import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const events = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/components/analytics-provider", () => ({
  trackEvent: events.track,
  captureInquiryAttribution: () => undefined,
}));
import { PublicForm } from "@/components/public-form";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  events.track.mockClear();
});
function fill() {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "QA" } });
  fireEvent.change(screen.getByLabelText("Business name"), {
    target: { value: "QA business" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "qa@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Service needed"), {
    target: { value: "Local SEO" },
  });
  fireEvent.change(screen.getByLabelText("What would you like help with?"), {
    target: { value: "A consultation" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
}
describe("Consultation confirmation", () => {
  it("includes the selected public package in the saved-inquiry payload without replacing the visitor message", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ saved: true, duplicate: false }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const context = "Requested package: Business Website ($2,500 one-time).";
    const { container } = render(
      <PublicForm
        type="project-request"
        service="Website design or redesign"
        inquiryContext={context}
      />,
    );
    expect(screen.getByLabelText("Service needed")).toHaveValue(
      "Website design or redesign",
    );
    expect(screen.getByText(context)).toBeInTheDocument();
    fill();
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByText("Request received");
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.projectDescription).toBe(`${context}\n\nA consultation`);
    expect(payload.consent).toBe("on");
  });

  it("retains the submission token on a failed request and tracks success only after a confirmed save", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Retry" }), { status: 503 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ saved: true, duplicate: false, message: "Saved" }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<PublicForm type="project-request" />);
    fill();
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByRole("alert");
    expect(events.track).not.toHaveBeenCalledWith(
      "project_request_form_submit_success",
    );
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByText("Request received");
    expect(events.track).toHaveBeenCalledWith(
      "project_request_form_submit_success",
    );
    const bodies = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body));
    expect(bodies[0].submissionToken).toBe(bodies[1].submissionToken);
  });
  it("does not report a conversion for an unconfirmed response or duplicate", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unconfirmed" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ saved: true, duplicate: true }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<PublicForm type="project-request" />);
    fill();
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByText("Request received");
    expect(events.track).not.toHaveBeenCalledWith(
      "project_request_form_submit_success",
    );
  });
});
