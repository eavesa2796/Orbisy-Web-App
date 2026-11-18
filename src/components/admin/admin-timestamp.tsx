import { adminDateTime } from "@/lib/admin-date-time";
export function AdminTimestamp({date,label}:{date:Date|null|undefined;label?:string}) {
 const parts=adminDateTime(date);
 if(!parts)return <span className="sales-time-empty">Not recorded</span>;
 return <time className="sales-timestamp" dateTime={parts.iso} title="Chicago time (America/Chicago)">{label&&<span className="sales-time-label">{label}</span>}<span>{parts.date}</span><strong>{parts.time}</strong></time>;
}
