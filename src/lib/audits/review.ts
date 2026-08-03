import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { adminActivityLogs, auditConfidenceScores, auditFindings, auditPages, auditReviewEvents, auditRuns, websiteImprovementScores } from "@/lib/db/schema";
import { getImportSettings } from "@/lib/imports/service";
import { calculateAuditConfidence } from "./confidence";
import { phaseFiveReadiness } from "./policy";
import { auditSuppressionStillClear } from "./service";
import { calculateWebsiteImprovement } from "./scoring";

export async function reviewFinding(input: { findingId: string; status: "verified" | "rejected" | "edited"; explanation?: string; actor: string }) {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(auditFindings).where(eq(auditFindings.id, input.findingId)).limit(1);
    if (!current) throw new Error("Finding not found.");
    if (current.source === "manual" && input.status === "edited") throw new Error("Manual findings should be corrected by adding a new review event.");
    const explanation = input.explanation?.trim();
    if (input.status === "edited" && (!explanation || explanation.length < 5)) throw new Error("Edited wording requires an explanation.");
    await tx.update(auditFindings).set({ verificationStatus: input.status, administratorExplanation: explanation || current.administratorExplanation, verifiedBy: input.actor, verifiedAt: new Date(), updatedAt: new Date() }).where(eq(auditFindings.id, input.findingId));
    await tx.insert(auditReviewEvents).values({ runId: current.runId, leadId: current.leadId, findingId: current.id, eventType: `finding_${input.status}`, administratorEmail: input.actor, explanation: explanation || `Finding marked ${input.status}.` });
    await tx.insert(adminActivityLogs).values({ adminEmail: input.actor, action: `audit.finding_${input.status}`, entityType: "audit_finding", entityId: current.id });
  });
}

export async function addManualFinding(input: { runId: string; category: typeof auditFindings.$inferInsert.category; severity: typeof auditFindings.$inferInsert.severity; confidence: typeof auditFindings.$inferInsert.confidence; explanation: string; evidence: string; suggestedImprovement: string; affectedUrl?: string; actor: string }) {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [run] = await tx.select().from(auditRuns).where(eq(auditRuns.id, input.runId)).limit(1); if (!run) throw new Error("Audit run not found.");
    const [finding] = await tx.insert(auditFindings).values({ runId: run.id, leadId: run.leadId, category: input.category, findingType: "administrator_observation", originalExplanation: input.explanation, evidence: { observation: input.evidence }, affectedUrl: input.affectedUrl, severity: input.severity, confidence: input.confidence, source: "manual", verificationStatus: "verified", suggestedImprovement: input.suggestedImprovement, analyzerVersion: "manual-v1", verifiedBy: input.actor, verifiedAt: new Date() }).returning();
    await tx.insert(auditReviewEvents).values({ runId: run.id, leadId: run.leadId, findingId: finding.id, eventType: "manual_finding_added", administratorEmail: input.actor, explanation: input.explanation, evidence: { observation: input.evidence } });
    await tx.insert(adminActivityLogs).values({ adminEmail: input.actor, action: "audit.manual_finding_added", entityType: "audit_finding", entityId: finding.id });
  });
}

export async function completeAuditReview(runId: string, actor: string) {
  const db = getDb(); const settings = await getImportSettings();
  const [run] = await db.select().from(auditRuns).where(eq(auditRuns.id, runId)).limit(1);
  if (!run || !["completed", "completed_with_warnings"].includes(run.status)) throw new Error("Only completed audits can be reviewed.");
  const [findings, pages, priorConfidence] = await Promise.all([
    db.select().from(auditFindings).where(eq(auditFindings.runId, runId)),
    db.select().from(auditPages).where(eq(auditPages.runId, runId)),
    db.select().from(auditConfidenceScores).where(eq(auditConfidenceScores.runId, runId)).orderBy(desc(auditConfidenceScores.calculatedAt)).limit(1),
  ]);
  if (findings.some((item) => item.verificationStatus === "pending")) throw new Error("Resolve every pending finding before completing review.");
  const score = calculateWebsiteImprovement(findings.map((item) => ({ ...item, explanation: item.originalExplanation, affectedUrl: item.affectedUrl || "" })), true);
  const priorFactors = priorConfidence[0]?.factors as { providerAvailable?: boolean; networkFailures?: number; parsingFailures?: number; conflictingResults?: number } | undefined;
  const confidence = calculateAuditConfidence({ analyzersCompleted: 6, analyzersExpected: 7, pagesInspected: pages.filter((page) => page.status === "inspected").length, pagesConfigured: settings.maxPagesPerAudit, providerAvailable: Boolean(priorFactors?.providerAvailable), networkFailures: Number(priorFactors?.networkFailures || 0), parsingFailures: Number(priorFactors?.parsingFailures || 0), conflictingResults: Number(priorFactors?.conflictingResults || 0), manualReviewed: findings.length, manualRequired: findings.length });
  const suppressionClear = await auditSuppressionStillClear(run.leadId);
  const readiness = phaseFiveReadiness({ runCompleted: true, confidence: confidence.level, minimumConfidence: settings.minimumAuditConfidence, unresolvedFindings: 0, suppressionClear, blockingError: Boolean(run.errorClassification), administratorCompletedReview: true });
  const ready = readiness.ready;
  await db.transaction(async (tx) => {
    await tx.insert(websiteImprovementScores).values({ runId, leadId: run.leadId, scoreVersion: score.version, categoryResults: score.categories, findingIds: score.findingIds, inputSnapshot: { reviewedFindingIds: findings.filter((item) => item.verificationStatus !== "rejected").map((item) => item.id) }, totalScore: score.total, scoreBand: score.band, coveragePercent: Math.round((6 / 7) * 100), provisional: false, manuallyReviewed: true });
    await tx.insert(auditConfidenceScores).values({ runId, level: confidence.level, factors: confidence.factors, explanation: confidence.explanation, calculationVersion: confidence.version });
    await tx.update(auditRuns).set({ reviewCompletedAt: new Date(), reviewCompletedBy: actor, phaseFiveReady: ready }).where(eq(auditRuns.id, runId));
    await tx.insert(auditReviewEvents).values({ runId, leadId: run.leadId, eventType: "review_completed", administratorEmail: actor, explanation: ready ? "Review completed and the audit is ready for Phase 5." : `Review completed but Phase 5 readiness is blocked: ${readiness.reasons.join(", ")}.` });
    await tx.insert(adminActivityLogs).values({ adminEmail: actor, action: "audit.review_completed", entityType: "audit_run", entityId: runId, metadata: { phaseFiveReady: ready, reasons: readiness.reasons } });
  });
  return { ready };
}

export async function reopenAuditReview(runId: string, actor: string, explanation: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [run] = await tx.update(auditRuns).set({ reviewCompletedAt: null, reviewCompletedBy: null, phaseFiveReady: false }).where(eq(auditRuns.id, runId)).returning();
    if (!run) throw new Error("Audit run not found.");
    await tx.insert(auditReviewEvents).values({ runId, leadId: run.leadId, eventType: "review_reopened", administratorEmail: actor, explanation });
    await tx.insert(adminActivityLogs).values({ adminEmail: actor, action: "audit.review_reopened", entityType: "audit_run", entityId: runId });
  });
}
