import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,expect,it,vi} from "vitest";
const db=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/db",()=>({getDb:db}));
import Page from "./page";
afterEach(()=>vi.unstubAllEnvs());
it("provides a read-only preview without database access and is unavailable in production",()=>{
 vi.stubEnv("VERCEL_ENV","production");expect(()=>Page()).toThrow(/404/);
 vi.stubEnv("VERCEL_ENV","preview");const html=renderToStaticMarkup(Page());
 expect(html).toContain("No database is read");expect(html).toContain("$4,000–$9,000");expect(html).toContain("7:05 PM CST");expect(html).not.toContain("Google Ads setup");expect(html).not.toContain("<form");expect(db).not.toHaveBeenCalled();
});
