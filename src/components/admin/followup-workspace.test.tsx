import {afterEach,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
vi.mock("@/app/admin-portal/followups/actions",()=>({approveFollowupAction:vi.fn(),followupConversationAction:vi.fn(),enrollFollowupAction:vi.fn(),saveFollowupSettingsAction:vi.fn(),disconnectFollowupGmailAction:vi.fn(),runFollowupsAction:vi.fn()}));
import Preview from "@/app/preview/followups/page";
import {FollowupWorkspace} from "./followup-workspace";
import {defaultTemplates} from "@/lib/followups/model";
import type {FollowupOverview} from "@/lib/data/followups";
afterEach(()=>{cleanup();vi.unstubAllEnvs();});
it("lets an owner inspect the draft and timeline while preview send/mutation controls stay disabled",()=>{vi.stubEnv("VERCEL_ENV","preview");render(Preview());const summary=screen.getByText("Example Association · fictional inquiry").closest("summary")!;fireEvent.click(summary);expect(screen.getByText("Conversation timeline")).toBeInTheDocument();expect(screen.getByText("Approve reviewed email")).toBeDisabled();expect(screen.getByRole("button",{name:"Save follow-up settings"})).toBeDisabled();expect(screen.getByText("Fictional inquiry enrolled as a draft. No email sent.")).toBeInTheDocument();});

function renderConnectionNotice(notice: string, gmailConnected = false) {
 const data: FollowupOverview = {
  settings: {enrollmentEnabled:false,sendingEnabled:false,autoAcknowledge:false,activatedAt:null,templates:defaultTemplates,digestEnabled:false,digestHour:18,gmailConnected,gmailSyncedAt:null,gmailError:null,gmailBacklog:false,lastWorkerAt:null},
  readiness: {gmail:true,sending:false,resend:false,webhook:false,mailing:false,scheduler:false},
  conversations:[],messages:[],events:[],
 };
 render(<FollowupWorkspace data={data} connectionNotice={notice}/>);
}

it("shows a useful error when Google returns a failed authorization", () => {
 renderConnectionNotice("gmail_failed");
 expect(screen.getByRole("alert")).toHaveTextContent("Gmail could not be connected");
 expect(screen.getByRole("alert")).toHaveTextContent("Google client settings and production credentials");
});

it("explains cancelled authorization and keeps the connection button available", () => {
 renderConnectionNotice("gmail_denied");
 expect(screen.getByRole("alert")).toHaveTextContent("cancelled or denied");
 expect(screen.getByRole("button", {name:"Connect info@orbisy.com with Google"})).toBeEnabled();
});

it("confirms a saved Gmail connection without implying sending is enabled", () => {
 renderConnectionNotice("gmail_connected", true);
 expect(screen.getByRole("status")).toHaveTextContent("Gmail connected to info@orbisy.com");
 expect(screen.getByText(/^Customer sending is disabled\./)).toBeInTheDocument();
});

it("does not claim a saved connection based only on a query parameter", () => {
 renderConnectionNotice("gmail_connected");
 expect(screen.getByRole("alert")).toHaveTextContent("Gmail could not be connected");
 expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("ignores unrecognized callback notices without displaying query text", () => {
 renderConnectionNotice("untrusted-query-value");
 expect(screen.queryByRole("alert")).not.toBeInTheDocument();
 expect(screen.queryByText("untrusted-query-value")).not.toBeInTheDocument();
});
