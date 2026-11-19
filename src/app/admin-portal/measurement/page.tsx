import {requireAdmin} from "@/lib/auth";
import {AdminShell} from "@/components/admin/admin-shell";
import {MeasurementPlan} from "@/components/admin/measurement-plan";
export const dynamic="force-dynamic";
export default async function MeasurementPage(){const admin=await requireAdmin();return <AdminShell email={admin.email}><header className="admin-heading"><div><p className="eyebrow">Audience & campaign reporting</p><h1>Measurement setup</h1><p>What Orbisy measures, how to read it, and what to verify before running ads.</p></div></header><MeasurementPlan /></AdminShell>;}
