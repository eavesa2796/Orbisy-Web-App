import {renderToStaticMarkup} from "react-dom/server";
import {expect,it} from "vitest";
import {LeadReceivedTime} from "./lead-received-time";
it("uses the submission receipt time for inquiries, creation for other leads, and no invented fallback",()=>{
 const createdAt=new Date("2026-11-18T18:00:00Z");
 const html=renderToStaticMarkup(<LeadReceivedTime submissionId="inquiry" inquiryReceivedAt={new Date("2026-11-18T01:05:00Z")} createdAt={createdAt}/>);
 expect(html).toContain("Received");expect(html).toContain("Nov 17, 2026");expect(html).toContain("7:05 PM CST");expect(html).toContain('dateTime="2026-11-18T01:05:00.000Z"');
 expect(renderToStaticMarkup(<LeadReceivedTime submissionId={null} inquiryReceivedAt={null} createdAt={createdAt}/>)).toContain("Added");
 expect(renderToStaticMarkup(<LeadReceivedTime submissionId="missing" inquiryReceivedAt={null} createdAt={createdAt}/>)).toContain("Not recorded");
});
