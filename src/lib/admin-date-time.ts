export const ADMIN_TIME_ZONE = "America/Chicago";
const dateFormat = new Intl.DateTimeFormat("en-US", {timeZone:ADMIN_TIME_ZONE,month:"short",day:"numeric",year:"numeric"});
const timeFormat = new Intl.DateTimeFormat("en-US", {timeZone:ADMIN_TIME_ZONE,hour:"numeric",minute:"2-digit",hour12:true,timeZoneName:"short"});
export function adminDateTime(date:Date|null|undefined) {
 if(!date || !Number.isFinite(date.getTime()))return null;
 return {iso:date.toISOString(),date:dateFormat.format(date),time:timeFormat.format(date)};
}
export function formatAdminDateTime(date:Date|null|undefined) {
 const parts=adminDateTime(date);return parts?`${parts.date} · ${parts.time}`:"—";
}
