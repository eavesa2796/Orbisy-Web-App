"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  adminActivityLogs,
  auditFindings,
  auditRuns,
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
import {
  containsUnsupportedImpactClaim,
  findingDisplayText,
} from "@/lib/outreach/policy";

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
  if (parsed.status === "suppressed" && current.status !== "suppressed") {
    throw new Error("Use the suppression form so a reason and suppression entry are recorded.");
  }
  if (current.status === "suppressed" && parsed.status !== "suppressed") {
    throw new Error("Suppressed leads cannot be restored from the general status form.");
  }

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
    observationOne: z.string().trim().max(500).optional(),
    observationTwo: z.string().trim().max(500).optional(),
    relevantContext: z.string().trim().max(1000).optional(),
    whyItMayMatter: z.string().trim().max(1500).optional(),
    suggestedImprovement: z.string().trim().max(1000).optional(),
    personalizationNotes: z.string().trim().max(1000).optional(),
    recommendedNextAction: z.string().trim().max(500).optional(),
    ready: z.boolean(),
  });
  const parsed = schema.parse({
    subject: string(formData, "subject"),
    body: string(formData, "body"),
    observationOne: string(formData, "observationOne"),
    observationTwo: string(formData, "observationTwo"),
    relevantContext: string(formData, "relevantContext"),
    whyItMayMatter: string(formData, "whyItMayMatter"),
    suggestedImprovement: string(formData, "suggestedImprovement"),
    personalizationNotes: string(formData, "personalizationNotes"),
    recommendedNextAction: string(formData, "recommendedNextAction"),
    ready: formData.get("ready") === "on",
  });

  const reviewedLanguage = [
    parsed.body,
    parsed.whyItMayMatter,
    parsed.suggestedImprovement,
  ].filter(Boolean).join(" ");
  if (containsUnsupportedImpactClaim(reviewedLanguage)) {
    throw new Error("Remove unsupported revenue or monetary-loss claims before saving.");
  }

  const db = getDb();
  const [lead] = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);
  if (!lead || lead.status === "suppressed") return;

  const [existing] = await db
    .select()
    .from(outreachDrafts)
    .where(eq(outreachDrafts.leadId, id))
    .orderBy(desc(outreachDrafts.updatedAt))
    .limit(1);

  const [phaseFiveRun] = await db
    .select()
    .from(auditRuns)
    .where(and(eq(auditRuns.leadId, id), eq(auditRuns.phaseFiveReady, true)))
    .orderBy(desc(auditRuns.reviewCompletedAt), desc(auditRuns.createdAt))
    .limit(1);

  let selectedFindingIds: string[] = [];
  let observations: string[];
  if (phaseFiveRun) {
    selectedFindingIds = z.array(z.uuid()).min(1).max(2).parse(
      [...new Set(formData.getAll("findingId").map(String))],
    );
    if (!parsed.relevantContext || !parsed.whyItMayMatter || !parsed.suggestedImprovement || !parsed.recommendedNextAction) {
      throw new Error("Complete every required outreach-brief field before saving.");
    }
    const selectedFindings = await db
      .select()
      .from(auditFindings)
      .where(
        and(
          eq(auditFindings.runId, phaseFiveRun.id),
          inArray(auditFindings.id, selectedFindingIds),
          inArray(auditFindings.verificationStatus, ["verified", "edited"]),
        ),
      );
    if (selectedFindings.length !== selectedFindingIds.length) {
      throw new Error("Every selected observation must be verified in the current audit.");
    }
    observations = selectedFindingIds.map((findingId) => {
      const finding = selectedFindings.find((item) => item.id === findingId);
      if (!finding) throw new Error("Verified finding not found.");
      return findingDisplayText(finding);
    });
  } else {
    if (existing?.auditRunId) {
      throw new Error("The linked audit is no longer Phase 5-ready. Complete its review before editing this brief.");
    }
    if (!existing && lead.status !== "new_inbound") {
      throw new Error("A reviewed Phase 5-ready audit is required for outbound drafting.");
    }
    observations = [parsed.observationOne, parsed.observationTwo].filter(Boolean) as string[];
    if (!observations.length) throw new Error("Add at least one manually verified observation.");
  }

  const approvedAt = parsed.ready ? new Date() : null;
  const values = {
    auditRunId: phaseFiveRun?.id ?? existing?.auditRunId ?? null,
    status: parsed.ready ? "approved" : "draft",
    subject: parsed.subject,
    body: parsed.body,
    relevantContext: parsed.relevantContext,
    verifiedObservations: observations,
    selectedFindingIds,
    whyItMayMatter: parsed.whyItMayMatter,
    suggestedImprovement: parsed.suggestedImprovement,
    personalizationNotes: parsed.personalizationNotes,
    recommendedNextAction: parsed.recommendedNextAction,
    readyForManualUse: parsed.ready,
    reviewedBy: parsed.ready ? admin.email : null,
    reviewedAt: approvedAt,
    updatedAt: new Date(),
  } as const;

  await db.transaction(async (tx) => {
    if (existing) {
      await tx.update(outreachDrafts).set(values)
        .where(and(eq(outreachDrafts.id, existing.id), eq(outreachDrafts.leadId, id)));
    } else {
      await tx.insert(outreachDrafts).values({ leadId: id, ...values });
    }
    const plannableStatuses: string[] = [
      "new_inbound",
      "manually_added",
      "needs_review",
      "qualified",
    ];
    if (parsed.ready && plannableStatuses.includes(lead.status)) {
      await tx.update(leads).set({ status: "contact_planned", updatedAt: new Date() }).where(eq(leads.id, id));
      await tx.insert(pipelineEvents).values({
        leadId: id,
        fromStatus: lead.status,
        toStatus: "contact_planned",
        note: "Administrator approved an outreach brief for manual use.",
      });
    }
  });
  await logActivity(admin.email, "outreach_draft.saved", "lead", id);
  revalidatePath(`/admin-portal/leads/${id}`);
  revalidatePath("/admin-portal/dashboard");
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

  const db = getDb();
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: leads.status })
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);
    if (!current || current.status === "suppressed") {
      throw new Error("Suppressed or missing leads cannot record contact.");
    }
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
    if (current.status !== "contacted") {
      await tx.insert(pipelineEvents).values({
        leadId: id,
        fromStatus: current.status,
        toStatus: "contacted",
        note: `Manual ${parsed.channel} contact recorded.`,
      });
    }
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
    await tx
      .update(outreachDrafts)
      .set({
        status: "blocked",
        readyForManualUse: false,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(outreachDrafts.leadId, id));
  });
  await logActivity(admin.email, "lead.suppressed", "lead", id);
  revalidatePath(`/admin-portal/leads/${id}`);
}
