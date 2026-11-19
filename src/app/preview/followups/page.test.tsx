import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,expect,it,vi} from "vitest";
const db=vi.hoisted(()=>vi.fn());vi.mock("@/lib/db",()=>({getDb:db}));
import Page from "./page";
afterEach(()=>vi.unstubAllEnvs());
it("keeps the fictional follow-up preview read-only, off production, and independent of database/mailbox data",()=>{vi.stubEnv("VERCEL_ENV","production");expect(()=>Page()).toThrow(/404/);vi.stubEnv("VERCEL_ENV","preview");const html=renderToStaticMarkup(Page());expect(html).toContain("Fictional data");expect(html).toContain("5 a.m.–9 p.m.");expect(html).toContain("Customer sending is disabled");expect(html).toContain("Approve reviewed email");expect(html).toContain("<fieldset disabled");expect(html).not.toContain("gmail_token_ciphertext");expect(db).not.toHaveBeenCalled();});
