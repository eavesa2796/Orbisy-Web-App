import {expect,it,vi} from "vitest";
const admin=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/auth",()=>({requireAdmin:admin}));
import Page from "./page";
it("requires administrator authorization before returning the measurement tools",async()=>{admin.mockRejectedValueOnce(Error("Unauthorized"));await expect(Page()).rejects.toThrow("Unauthorized");admin.mockResolvedValueOnce({email:"admin@example.test"});expect(await Page()).toBeTruthy();});
