import {afterEach,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
vi.mock("@/app/admin-portal/followups/actions",()=>({approveFollowupAction:vi.fn(),followupConversationAction:vi.fn(),enrollFollowupAction:vi.fn(),saveFollowupSettingsAction:vi.fn(),disconnectFollowupGmailAction:vi.fn(),runFollowupsAction:vi.fn()}));
import Preview from "@/app/preview/followups/page";
afterEach(()=>{cleanup();vi.unstubAllEnvs();});
it("lets an owner inspect the draft and timeline while preview send/mutation controls stay disabled",()=>{vi.stubEnv("VERCEL_ENV","preview");render(Preview());const summary=screen.getByText("Example Association · fictional inquiry").closest("summary")!;fireEvent.click(summary);expect(screen.getByText("Conversation timeline")).toBeInTheDocument();expect(screen.getByText("Approve reviewed email")).toBeDisabled();expect(screen.getByRole("button",{name:"Save follow-up settings"})).toBeDisabled();expect(screen.getByText("Fictional inquiry enrolled as a draft. No email sent.")).toBeInTheDocument();});
