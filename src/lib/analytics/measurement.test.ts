import {expect,it} from "vitest";
import {googleCampaignParameters,measurementPageContext,classifyMeasurementLink,buildCampaignUrl} from "./measurement";
it("accepts bounded marketing labels while excluding contact details, click IDs, arbitrary parameters and sensitive-looking numbers",()=>{
 expect(googleCampaignParameters(new URL("https://www.orbisy.com/?utm_source=google&utm_medium=cpc&utm_campaign=association-websites&utm_content=ad-a&utm_term=member+portal&gclid=secret&email=private@example.test"))).toEqual({campaign_source:"google",campaign_medium:"cpc",campaign_name:"association-websites",campaign_content:"ad-a",campaign_term:"member portal"});
 expect(googleCampaignParameters(new URL("https://www.orbisy.com/?utm_source=person%40example.test&utm_medium=%3Cscript%3E&utm_campaign=312-555-1234&utm_content="+"x".repeat(81)))).toEqual({});
});
it("labels current service pages and clears service interest on other pages",()=>{expect(measurementPageContext("/member-portals")).toEqual({content_group:"services",service_interest:"member_portals"});expect(measurementPageContext("/work")).toEqual({content_group:"portfolio",service_interest:"not_applicable"});});
it("classifies only known interactions, using fixed labels instead of href/text or email content",()=>{
 const origin="https://www.orbisy.com";
 expect(classifyMeasurementLink("/#contact",origin,"header")).toEqual({event:"primary_cta_click",component:"header_consultation"});
 expect(classifyMeasurementLink("/integrations?secret=private",origin,"content")?.component).toBe("service_integrations");
 expect(classifyMeasurementLink("mailto:info@orbisy.com?body=private",origin,"footer")).toEqual({event:"contact_link_click",component:"email_contact"});
 expect(classifyMeasurementLink("mailto:client@example.test",origin,"footer")).toBeUndefined();
 expect(classifyMeasurementLink("https://other.example/#contact",origin,"content")).toBeUndefined();
 expect(classifyMeasurementLink("/admin-portal/leads/secret",origin,"content")).toBeUndefined();
});
it("builds only known Orbisy landing URLs with safe consistent UTM labels",()=>{
 const link=buildCampaignUrl("/association-websites","google","cpc","association-search","ad-a")!;
 expect(link.url).toBe("https://www.orbisy.com/association-websites?utm_source=google&utm_medium=cpc&utm_campaign=association-search&utm_content=ad-a");
 expect(link.suffix).not.toContain("?");
 expect(buildCampaignUrl("https://other.example/","google","cpc","campaign","")).toBeUndefined();
 expect(buildCampaignUrl("/member-portals","google","cpc","person@example.test","")).toBeUndefined();
 expect(buildCampaignUrl("/member-portals","google","cpc","","")).toBeUndefined();
});
