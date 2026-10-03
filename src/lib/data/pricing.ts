import "server-only";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { pricingEntries } from "@/lib/db/schema";
export async function getPricingEntries() {
  await requireAdmin();
  return getDb()
    .select()
    .from(pricingEntries)
    .orderBy(asc(pricingEntries.category), asc(pricingEntries.name));
}
