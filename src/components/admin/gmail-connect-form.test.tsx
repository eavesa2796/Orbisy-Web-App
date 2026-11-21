import {afterEach, expect, it, vi} from "vitest";
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {GmailConnectForm} from "./gmail-connect-form";

afterEach(() => {cleanup(); vi.unstubAllGlobals();});

it("shows progress and prevents duplicate connection requests", async () => {
  let complete!: (response: Response) => void;
  const request = vi.fn(() => new Promise<Response>(resolve => {complete = resolve;}));
  vi.stubGlobal("fetch", request);
  render(<GmailConnectForm/>);
  const button = screen.getByRole("button", {name:"Connect info@orbisy.com with Google"});
  const form = button.closest("form")!;
  expect(form).toHaveAttribute("action", "/api/admin/followups/gmail/start");
  expect(form).toHaveAttribute("method", "post");
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(request).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", {name:"Opening Google…"})).toBeDisabled();
  complete(new Response(null, {status:401}));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("session has expired"));
  expect(screen.getByRole("button", {name:"Connect info@orbisy.com with Google"})).toBeEnabled();
});

it("shows a configuration failure and supports retrying the connection", async () => {
  const request = vi.fn().mockResolvedValue(new Response(null, {status:409}));
  vi.stubGlobal("fetch", request);
  render(<GmailConnectForm/>);
  fireEvent.click(screen.getByRole("button", {name:"Connect info@orbisy.com with Google"}));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("settings are not ready"));
  fireEvent.click(screen.getByRole("button", {name:"Connect info@orbisy.com with Google"}));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
});
