// @vitest-environment node
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
const mocked = vi.hoisted(() => ({
  db: null as unknown as ReturnType<typeof getDb>,
  getDb: vi.fn(),
  admin: vi.fn(),
  afterJobs: [] as Array<() => Promise<void>>,
  spam: vi.fn(),
  rateLimit: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  getDb: () => {
    mocked.getDb();
    return mocked.db;
  },
}));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocked.admin }));
vi.mock("@/lib/spam", () => ({ verifyTurnstile: mocked.spam }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocked.rateLimit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (job: () => Promise<void>) => mocked.afterJobs.push(job),
}));
import { POST } from "@/app/api/submissions/[type]/route";
import {
  savePricingAction,
  addPricingTemplatesAction,
} from "@/app/admin-portal/pricing/actions";
import { getPricingEntries } from "@/lib/data/pricing";
import { deliverSubmissionNotification } from "@/lib/notifications";
import { retryNotificationAction } from "@/app/admin-portal/notifications/actions";
import { pricingTemplates } from "@/lib/pricing-draft";
let pg: PGlite;
const oldLead = "eaa40521-7c75-4993-a3f7-e4e4b9c226cb";
beforeAll(async () => {
  pg = new PGlite();
  for (const name of (await readdir(join(process.cwd(), "drizzle")))
    .filter((n) => /^000[0-7].*sql$/.test(n))
    .sort())
    await pg.exec(
      (await readFile(join(process.cwd(), "drizzle", name), "utf8")).replaceAll(
        "--> statement-breakpoint",
        "",
      ),
    );
  await pg.query(
    "insert into leads(id,business_name,source_name,status) values($1,'Preserved legacy record','Existing source','proposal_sent')",
    [oldLead],
  );
  await pg.exec(
    (
      await readFile(
        join(process.cwd(), "drizzle/0008_agency_pricing_notifications.sql"),
        "utf8",
      )
    ).replaceAll("--> statement-breakpoint", ""),
  );
  mocked.db = drizzle(pg, { schema }) as unknown as ReturnType<typeof getDb>;
  mocked.admin.mockResolvedValue({ id: "admin", email: "owner@example.test" });
  mocked.spam.mockResolvedValue(true);
  mocked.rateLimit.mockResolvedValue(true);
}, 30000);
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  mocked.afterJobs.length = 0;
});
afterAll(async () => pg.close());
function payload() {
  return {
    name: "QA owner",
    businessName: "QA service business",
    email: "qa@example.test",
    websiteUrl: "",
    serviceNeeded: "Local SEO",
    projectDescription: "Request a consultation",
    consent: "on",
    company: "",
    submissionToken: crypto.randomUUID(),
    attribution: {
      landingPath: "/campaigns/local-google-ads",
      submissionPath: "/google-ads",
      utmSource: "google",
      utmCampaign: "local-services",
    },
  };
}
function send(data: unknown, headers?: Record<string, string>) {
  return POST(
    new Request("https://orbisy.example/api/submissions/project-request", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(data),
    }),
    { params: Promise.resolve({ type: "project-request" }) },
  );
}
async function notificationFor(token: string) {
  const [sub] = await mocked.db
    .select()
    .from(schema.contactSubmissions)
    .where(eq(schema.contactSubmissions.idempotencyKey, token));
  const [notification] = await mocked.db
    .select()
    .from(schema.submissionNotifications)
    .where(eq(schema.submissionNotifications.submissionId, sub.id));
  return { sub, notification };
}
function pricingForm(id = "") {
  return new FormDataBuilder({
    id,
    name: "QA website project",
    category: "website",
    description: "Defined project",
    deliverables: "Page plan\nLaunch checks",
    billingBasis: "one_time",
    amount: "",
    setupFee: "",
    recurringFee: "",
    recurringInterval: "",
    internalNotes: "Owner review required",
    status: "draft",
  }).form;
}
class FormDataBuilder {
  form = new FormData();
  constructor(values: Record<string, string>) {
    Object.entries(values).forEach(([k, v]) => this.form.set(k, v));
  }
}
describe("Agency database and inquiry workflow", () => {
  it("preserves prior records and protects both private tables with RLS", async () => {
    expect(
      (
        await pg.query("select business_name,status from leads where id=$1", [
          oldLead,
        ])
      ).rows[0],
    ).toEqual({
      business_name: "Preserved legacy record",
      status: "proposal_sent",
    });
    const secured = await pg.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname in ('pricing_entries','submission_notifications')",
    );
    expect(secured.rows).toHaveLength(2);
    expect(secured.rows.every((r) => r.relrowsecurity)).toBe(true);
  });
  it("rejects invalid, nonconsenting, honeypot, and failed spam requests before saving", async () => {
    for (const data of [
      { ...payload(), consent: "" },
      { ...payload(), company: "spam" },
      { ...payload(), email: "bad" },
    ])
      expect((await send(data)).status).toBe(400);
    mocked.spam.mockResolvedValueOnce(false);
    expect((await send(payload())).status).toBe(400);
    mocked.rateLimit.mockResolvedValueOnce(false);
    expect((await send(payload())).status).toBe(429);
  });
  it("atomically saves a lead and pending notification before acknowledging success, and deduplicates retries", async () => {
    const data = payload();
    const first = await send(data);
    expect(await first.json()).toMatchObject({ saved: true, duplicate: false });
    const { sub, notification } = await notificationFor(data.submissionToken);
    expect(sub.attribution?.utmCampaign).toBe("local-services");
    expect(notification.status).toBe("pending");
    const [lead] = await mocked.db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.submissionId, sub.id));
    expect(lead.sourceName).toBe("Inbound consultation");
    expect(mocked.afterJobs).toHaveLength(1);
    expect(await (await send(data)).json()).toMatchObject({
      saved: true,
      duplicate: true,
    });
    expect(mocked.afterJobs).toHaveLength(1);
  });
  it("removes attribution when analytics are disabled, DNT, or GPC is supplied", async () => {
    for (const headers of [{ dnt: "1" }, { "sec-gpc": "1" }, {}] as Record<
      string,
      string
    >[]) {
      if (!Object.keys(headers).length)
        vi.stubEnv("ANALYTICS_ENABLED", "false");
      const data = payload();
      expect((await send(data, headers)).status).toBe(200);
      expect(
        (await notificationFor(data.submissionToken)).sub.attribution,
      ).toBeNull();
    }
  });
  it("rolls back the submission when a lead write fails", async () => {
    // Deliberate unique constraint collision proves the transaction cannot leave a hidden partial inquiry.
    await pg.exec(
      "create unique index qa_force_lead_failure on leads (business_name) where business_name='QA collision'",
    );
    await pg.exec(
      "insert into leads(business_name,source_name) values('QA collision','QA')",
    );
    const data = { ...payload(), businessName: "QA collision" };
    expect((await send(data)).status).toBe(500);
    expect(
      await mocked.db
        .select()
        .from(schema.contactSubmissions)
        .where(
          eq(schema.contactSubmissions.idempotencyKey, data.submissionToken),
        ),
    ).toHaveLength(0);
    await pg.exec("drop index qa_force_lead_failure");
  });
  it("keeps saved leads when email configuration is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const data = payload();
    expect((await send(data)).status).toBe(200);
    await mocked.afterJobs[0]();
    const { notification } = await notificationFor(data.submissionToken);
    expect(notification.status).toBe("not_configured");
    expect(notification.attempts).toBe(1);
  });
  it("records provider failure and retries to accepted state without repeated sends", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-only");
    vi.stubEnv("RESEND_FROM_EMAIL", "from@example.test");
    vi.stubEnv("NOTIFICATION_EMAIL", "owner@example.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValue(new Response('{"id":"test"}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const data = payload();
    await send(data);
    await mocked.afterJobs[0]();
    let { notification } = await notificationFor(data.submissionToken);
    expect(notification.status).toBe("failed");
    expect(await deliverSubmissionNotification(notification.id)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await pg.query(
      "update submission_notifications set last_attempt_at=now()-interval '2 minutes' where id=$1",
      [notification.id],
    );
    expect(await deliverSubmissionNotification(notification.id)).toBe(true);
    notification = (await notificationFor(data.submissionToken)).notification;
    expect(notification.status).toBe("sent");
    expect(notification.attempts).toBe(2);
    expect(await deliverSubmissionNotification(notification.id)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const keys = fetchMock.mock.calls.map(
      (call) => (call[1] as RequestInit).headers as Record<string, string>,
    );
    expect(keys[0]["Idempotency-Key"]).toBe(keys[1]["Idempotency-Key"]);
    const emailBodies = fetchMock.mock.calls.map((call) =>
      JSON.parse((call[1] as RequestInit).body as string),
    );
    expect(emailBodies[0]).toMatchObject({ reply_to: data.email });
    for (const value of [
      data.name,
      data.businessName,
      data.email,
      data.serviceNeeded,
      data.projectDescription,
      "Budget: Not provided",
      "Timeline: Not provided",
      "/admin-portal/leads/",
    ]) {
      expect(emailBodies[0].text).toContain(value);
    }
    expect(emailBodies[1]).toEqual(emailBodies[0]);
  });
});
describe("Private pricing catalog", () => {
  it("creates repeatable service templates with all amounts unset", async () => {
    await addPricingTemplatesAction();
    await addPricingTemplatesAction();
    const entries = await getPricingEntries();
    expect(entries).toHaveLength(pricingTemplates.length);
    expect(
      entries.every(
        (e) =>
          e.amountCents === null &&
          e.setupFeeCents === null &&
          e.recurringFeeCents === null &&
          e.status === "draft",
      ),
    ).toBe(true);
  });
  it("persists edits, fees, deliverables, and lifecycle changes across reads", async () => {
    const form = pricingForm();
    expect(
      await savePricingAction({ message: "", success: false }, form),
    ).toMatchObject({ success: true });
    const created = (await getPricingEntries()).find(
      (e) => e.name === "QA website project",
    )!;
    expect(created.amountCents).toBeNull();
    expect(created.deliverables).toEqual(["Page plan", "Launch checks"]);
    form.set("id", created.id);
    form.set("amount", "1234.56");
    form.set("setupFee", "125");
    form.set("recurringFee", "90");
    form.set("recurringInterval", "monthly");
    form.set("status", "active");
    await savePricingAction({ message: "", success: false }, form);
    const edited = (await getPricingEntries()).find(
      (e) => e.id === created.id,
    )!;
    expect(edited).toMatchObject({
      amountCents: 123456,
      setupFeeCents: 12500,
      recurringFeeCents: 9000,
      status: "active",
    });
    form.set("status", "archived");
    await savePricingAction({ message: "", success: false }, form);
    expect(
      (await getPricingEntries()).find((e) => e.id === created.id)?.status,
    ).toBe("archived");
  });
  it("rejects invalid prices without changing persisted entries", async () => {
    const form = pricingForm();
    form.set("amount", "-10");
    expect(
      await savePricingAction({ message: "", success: false }, form),
    ).toMatchObject({ success: false });
    form.set("amount", "10.999");
    expect(
      await savePricingAction({ message: "", success: false }, form),
    ).toMatchObject({ success: false });
    form.set("amount", "");
    form.set("recurringFee", "20");
    expect(
      await savePricingAction({ message: "", success: false }, form),
    ).toMatchObject({ success: false });
  });
  it("requires administrator authorization before pricing reads/writes, seeding, and notification retry", async () => {
    for (const task of [
      () => getPricingEntries(),
      () => savePricingAction({ message: "", success: false }, pricingForm()),
      () => addPricingTemplatesAction(),
      () => retryNotificationAction(new FormData()),
    ]) {
      mocked.getDb.mockClear();
      mocked.admin.mockRejectedValueOnce(new Error("Unauthorized"));
      await expect(task()).rejects.toThrow("Unauthorized");
      expect(mocked.getDb).not.toHaveBeenCalled();
    }
  });
  it("denies direct anonymous database reads even if schema select privileges exist", async () => {
    await pg.exec(
      "create role qa_anon; grant usage on schema public to qa_anon; grant select on pricing_entries,submission_notifications to qa_anon; set role qa_anon;",
    );
    try {
      expect(
        (await pg.query("select * from pricing_entries")).rows,
      ).toHaveLength(0);
      expect(
        (await pg.query("select * from submission_notifications")).rows,
      ).toHaveLength(0);
    } finally {
      await pg.exec("reset role");
    }
  });
});
