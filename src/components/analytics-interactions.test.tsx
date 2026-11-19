import Link from "next/link";
import {cleanup,fireEvent,render} from "@testing-library/react";
import {afterEach,expect,it,vi} from "vitest";
const google=vi.hoisted(()=>({trackGoogleEvent:vi.fn(),trackGooglePage:vi.fn(),suspendGoogleAnalytics:vi.fn(),setGoogleConsent:vi.fn()}));
vi.mock("@/lib/analytics/google",()=>google);
vi.mock("next/navigation",()=>({usePathname:()=>"/"}));
vi.mock("@/components/google-analytics-consent",()=>({subscribeAnalyticsChoices:()=>()=>{},googleChoiceSnapshot:()=>"granted"}));
import {AnalyticsProvider} from "./analytics-provider";
import {TrackLink} from "./track-link";
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();});
it("tracks delegated consultation and service clicks exactly once and leaves TrackLink responsible for its own event",()=>{
 vi.stubGlobal("IntersectionObserver",class {observe(){}unobserve(){}disconnect(){}});
 const {getByText}=render(<><AnalyticsProvider/><header><Link href="/#contact">Consultation</Link></header><Link href="/member-portals">Portals</Link><TrackLink href="/#contact" componentId="hero_project_request" eventName="primary_cta_click">Hero consultation</TrackLink></>);
 fireEvent.click(getByText("Consultation"));expect(google.trackGoogleEvent).toHaveBeenLastCalledWith("primary_cta_click","header_consultation");
 fireEvent.click(getByText("Portals"));expect(google.trackGoogleEvent).toHaveBeenLastCalledWith("secondary_cta_click","service_member_portals");
 fireEvent.click(getByText("Hero consultation"));expect(google.trackGoogleEvent).toHaveBeenLastCalledWith("primary_cta_click","hero_project_request");expect(google.trackGoogleEvent).toHaveBeenCalledTimes(3);
});
