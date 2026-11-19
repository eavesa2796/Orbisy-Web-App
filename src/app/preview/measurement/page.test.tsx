import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,expect,it,vi} from "vitest";
import Page from "./page";
afterEach(()=>vi.unstubAllEnvs());
it("renders an honest setup guide only in preview/development",()=>{vi.stubEnv("VERCEL_ENV","production");expect(()=>Page()).toThrow(/404/);vi.stubEnv("VERCEL_ENV","preview");const html=renderToStaticMarkup(Page());expect(html).toContain("cannot verify Google account settings");expect(html).toContain("Build a campaign link");expect(html).toContain("does not yet import costs");});
