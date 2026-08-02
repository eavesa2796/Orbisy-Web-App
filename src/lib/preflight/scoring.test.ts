import { describe, expect, it } from "vitest";
import { calculateBusinessFit, decideAuditEligibility } from "./scoring";
const base={industryMatch:true,locationMatch:true,hasPublicContact:true,serviceSuitable:true,suppressed:false,exactDuplicate:false,existingDisqualifyingRelationship:false};
describe("Business Fit v1",()=>{
  it("is reproducible and totals explicit weights",()=>{expect(calculateBusinessFit(base)).toEqual(calculateBusinessFit(base));expect(calculateBusinessFit(base).total).toBe(100)});
  it("uses gates separately from points",()=>{const score=calculateBusinessFit({...base,suppressed:true,exactDuplicate:true});expect(score.total).toBe(100);expect(score.gates).toHaveLength(2)});
  it("awards no unsupported missing factors",()=>expect(calculateBusinessFit({...base,industryMatch:null,locationMatch:null,serviceSuitable:null}).total).toBe(15));
});
describe("audit eligibility",()=>{it("qualifies without starting an audit",()=>expect(decideAuditEligibility({preflightPassed:true,safeReachableWebsite:true,suppressed:false,exactDuplicate:false,industryMatch:true,locationMatch:true,score:80,minimumScore:65,requireIndustry:true,requireLocation:true,recentlyChecked:false,activeAuditOrJob:false}).status).toBe("eligible"));it("never numerically hides suppression",()=>expect(decideAuditEligibility({preflightPassed:true,safeReachableWebsite:true,suppressed:true,exactDuplicate:false,industryMatch:true,locationMatch:true,score:100,minimumScore:65,requireIndustry:true,requireLocation:true,recentlyChecked:false,activeAuditOrJob:false}).status).toBe("blocked"));});
