"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  adminActivityLogs,
  leads,
  leadNotes,
  manualContactAttempts,
  outreachDrafts,
  pipelineEvents,
  suppressionEntries,
} from "@/lib/db/schema";
import { leadSchema, updateLeadSchema } from "@/lib/validation";
import {
  normalizeEmail,
  normalizePhone,
  normalizePostalCode,
  normalizeSourceIdentifier,
  normalizeState,
  normalizeWebsite,
} from "@/lib/imports/normalization";

function string(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function logActivity(
  adminEmail: string,
  action: string,
  entityType: string,
  entityId?: string,
) {
  await getDb().insert(adminActivityLogs).values({
    adminEmail,
    action,
    entityType,
    entityId,
  });
}

export async function createLeadAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = leadSchema.parse({
    businessName: string(formData, "businessName"),
    contactName: string(formData, "contactName"),
    email: string(formData, "email"),
    websiteUrl: string(formData, "websiteUrl"),
    category: string(formData, "category"),
    industry: string(formData, "industry"),
    address: string(formData, "address"),
    city: string(formData, "city"),
    state: string(formData, "state"),
    postalCode: string(formData, "postalCode"),
    phone: string(formData, "phone"),
    location: string(formData, "location"),
    sourceName: string(formData, "sourceName"),
    sourceUrl: string(formData, "sourceUrl"),
    sourceIdentifier: string(formData, "sourceIdentifier"),
  });
  const website = normalizeWebsite(parsed.websiteUrl);

  const [lead] = await getDb()
    .insert(leads)
    .values({
      ...parsed,
      email: parsed.email?.toLowerCase() || undefined,
      normalizedEmail: normalizeEmail(parsed.email),
      phone: parsed.phone || undefined,
      normalizedPhone: normalizePhone(parsed.phone),
      websiteUrl: website.websiteUrl,
      normalizedDomain: website.normalizedDomain,
      websiteState: parsed.websiteUrl ? "provided" : "not_listed",
      state: normalizeState(parsed.state),
      postalCode: normalizePostalCode(parsed.postalCode),
      sourceIdentifier: normalizeSourceIdentifier(parsed.sourceIdentifier),
      status: "manually_added",
    })
    .returning({ id: leads.id });
  await logActivity(admin.email, "lead.created", "lead", lead.id);
  redirect(`/admin-portal/leads/${lead.id}`);
}

export async function updateLeadAction(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = updateLeadSchema.parse({
    status: string(formData, "status"),
    followUpAt: string(formData, "followUpAt"),
    note: string(formData, "note"),
  });

  const db = getDb();
  const [current] = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);
  if (!current) return;

  const followUpAt = parsed.followUpAt ? new Date(parsed.followUpAt) : null;
  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        status: parsed.status,
        followUpAt,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id));
    if (current.status !== parsed.status) {
      await tx.insert(pipelineEvents).values({
        leadId: id,
        fromStatus: current.status,
        toStatus: parsed.status,
        note: parsed.note,
      });
    }
    if (parsed.note) {
      await tx.insert(leadNotes).values({ leadId: id, body: parsed.note });
    }
  });
  await logActivity(admin.email, "lead.updated", "lead", id);
  revalidatePath(`/admin-portal/leads/${id}`);
  revalidatePath("/admin-portal/dashboard");
}

export async function saveDraftAction(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const schema = z.object({
    subject: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(6000),
    observationOne: z.string().trim().min(1).max(500),
    observationTwo: z.string().trim().max(500).optional(),
    ready: z.boolean(),
  });
  const parsed = schema.parse({
    subject: string(formData, "subject"),
    body: string(formData, "body"),
    observationOne: string(formData, "observationOne"),
    observationTwo: string(formData, "observationTwo"),
    ready: formData.get("ready") === "on",
  });

  const db = getDb();
  const [lead] = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);
  if (!lead || lead.status === "suppressed") return;

  const observations = [parsed.observationOne, parsed.observationTwo].filter(
    Boolean,
  ) as string[];
  const [existing] = await db
    .select({ id: outreachDrafts.id })
    .from(outreachDrafts)
    .where(eq(outreachDrafts.leadId, id))
    .limit(1);

  if (existing) {
    await db
      .update(outreachDrafts)
      .set({
        subject: parsed.subject,
        body: parsed.body,
        verifiedObservations: observations,
        readyForManualUse: parsed.ready,
        updatedAt: new Date(),
      })
      .where(and(eq(outreachDrafts.id, existing.id), eq(outreachDrafts.leadId, id)));
  } else {
    await db.insert(outreachDrafts).values({
      leadId: id,
      subject: parsed.subject,
      body: parsed.body,
      verifiedObservations: observations,
      readyForManualUse: parsed.ready,
    });
  }
  await logActivity(admin.email, "outreach_draft.saved", "lead", id);
  revalidatePath(`/admin-portal/leads/${id}`);
}

export async function recordContactAction(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const schema = z.object({
    channel: z.enum(["email", "phone", "linkedin", "other"]),
    contactedAt: z.string().trim().min(1).max(40),
    notes: z.string().trim().max(2000).optional(),
  });
  const parsed = schema.parse({
    channel: string(formData, "channel"),
    contactedAt: string(formData, "contactedAt"),
    notes: string(formData, "notes"),
  });

  const contactedAt = new Date(parsed.contactedAt);
  if (Number.isNaN(contactedAt.getTime())) throw new Error("Invalid contact date.");

  await getDb().transaction(async (tx) => {
    await tx.insert(manualContactAttempts).values({
      leadId: id,
      channel: parsed.channel,
      contactedAt,
      notes: parsed.notes,
    });
    await tx
      .update(leads)
      .set({ status: "contacted", updatedAt: new Date() })
      .where(eq(leads.id, id));
  });
  await logActivity(admin.email, "contact.recorded", "lead", id);
  revalidatePath(`/admin-portal/leads/${id}`);
}

export async function suppressLeadAction(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const reason = z.string().trim().min(1).max(1000).parse(string(formData, "reason"));
  const db = getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return;

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        status: "suppressed",
        suppressionReason: reason,
        suppressedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id));
    await tx.insert(suppressionEntries).values({
      leadId: id,
      normalizedEmail: lead.email?.toLowerCase(),
      normalizedDomain: lead.websiteUrl
        ? new URL(lead.websiteUrl).hostname.replace(/^www\./, "")
        : undefined,
      normalizedPhone: lead.normalizedPhone,
      normalizedSourceIdentifier: lead.sourceIdentifier,
      type: lead.normalizedEmail
        ? "email"
        : lead.normalizedDomain
          ? "domain"
          : lead.normalizedPhone
            ? "phone"
            : "lead",
      createdBy: admin.email,
      reason,
    });
  });
  await logActivity(admin.email, "lead.suppressed", "lead", id);
  revalidatePath(`/admin-portal/leads/${id}`);
}
