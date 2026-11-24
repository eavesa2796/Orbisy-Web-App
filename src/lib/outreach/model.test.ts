import {describe,expect,it} from "vitest";
import {afterOutreachDays,isOutreachTime,nextOutreachTime,prospectSchema,renderOutreach} from "./model";
describe("Outreach timing and personalization",()=>{
 it("uses weekdays and Chicago daylight-saving time",()=>{expect(isOutreachTime(new Date("2026-11-23T15:00:00Z"))).toBe(true);expect(isOutreachTime(new Date("2026-11-22T16:00:00Z"))).toBe(false);expect(nextOutreachTime(new Date("2026-11-20T23:00:00Z")).toISOString()).toBe("2026-11-23T15:00:00.000Z");expect(afterOutreachDays(new Date("2026-10-30T15:00:00Z"),3).toISOString()).toBe("2026-11-04T16:00:00.000Z");});
 it("renders only supported personal fields",()=>{expect(renderOutreach("Hi {{first_name}}, a question for {{organization}}.","Sam Example","An Association")).toBe("Hi Sam, a question for An Association.");});
 it("requires source and contact context, with a valid business email",()=>{expect(prospectSchema.safeParse({campaignId:"not-valid",recipientEmail:"x\r\nBcc:bad@example.test",sourceUrl:"javascript:alert(1)"}).success).toBe(false);});
});
