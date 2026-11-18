import { describe,expect,it } from "vitest";
import { adminDateTime,formatAdminDateTime } from "./admin-date-time";
describe("Administrator timestamps in Chicago time",()=>{
 it("shows receipt date and minute with the applicable timezone",()=>{expect(adminDateTime(new Date("2026-11-17T17:42:00Z"))).toEqual({iso:"2026-11-17T17:42:00.000Z",date:"Nov 17, 2026",time:"11:42 AM CST"});expect(adminDateTime(new Date("2026-07-17T17:42:00Z"))?.time).toBe("12:42 PM CDT");});
 it("preserves the actual receipt date across UTC midnight",()=>{expect(formatAdminDateTime(new Date("2026-11-18T01:05:00Z"))).toBe("Nov 17, 2026 · 7:05 PM CST");});
 it("distinguishes repeated clock times when daylight saving time ends",()=>{expect(adminDateTime(new Date("2026-11-01T06:30:00Z"))?.time).toBe("1:30 AM CDT");expect(adminDateTime(new Date("2026-11-01T07:30:00Z"))?.time).toBe("1:30 AM CST");});
 it("does not invent timestamps for missing or invalid records",()=>{expect(adminDateTime(null)).toBeNull();expect(adminDateTime(new Date("invalid"))).toBeNull();expect(formatAdminDateTime(undefined)).toBe("—");});
});
