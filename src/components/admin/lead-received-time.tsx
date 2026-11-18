import { AdminTimestamp } from "./admin-timestamp";
export function LeadReceivedTime({submissionId, inquiryReceivedAt, createdAt}: {submissionId: string|null; inquiryReceivedAt: Date|null|undefined; createdAt: Date}) {
  return <AdminTimestamp date={submissionId ? inquiryReceivedAt : createdAt} label={submissionId ? "Received" : "Added"} />;
}
