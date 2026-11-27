// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => true,
  checkGlobalRateLimit: async () => true,
}));
vi.mock("@/lib/project-assistant-knowledge", () => ({
  getAssistantPassages: async () => [],
  findAssistantSources: () => [{
    score: 8,
    passage: { id: "website-scope", title: "Association websites", source: "/association-websites", text: "Website projects include agreed testing and handover." },
  }],
}));

function ask(message: string) {
  return POST(new Request("https://www.orbisy.com/api/project-assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
  }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Orbisy project assistant recovery", () => {
  it("requires structured output with the retrieved source IDs and returns linked answers", async () => {
    vi.stubEnv("VERCEL_OIDC_TOKEN", "fictional-oidc-token");
    const gateway = vi.fn().mockResolvedValue(Response.json({
      choices: [{ message: { content: JSON.stringify({ answer: "Orbisy hands over the site after agreed testing.", handoff: false, sourceIds: ["website-scope"] }) } }],
    }));
    vi.stubGlobal("fetch", gateway);

    const response = await ask("What does website handover include?");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ handoff: false, sources: [{ href: "/association-websites" }] });
    const body = JSON.parse(gateway.mock.calls[0][1].body);
    expect(body.response_format).toMatchObject({
      type: "json_schema",
      json_schema: { strict: true, schema: { properties: { sourceIds: { items: { enum: ["website-scope"] } } } } },
    });
  });

  it.each(["unknown_source", "gateway_unavailable"])("shows related pages and a handoff for %s", async (scenario) => {
    vi.stubEnv("VERCEL_OIDC_TOKEN", "fictional-oidc-token");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = scenario === "unknown_source"
      ? Response.json({ choices: [{ message: { content: JSON.stringify({ answer: "Unverified claim", handoff: false, sourceIds: ["fabricated"] }) } }] })
      : Response.json({}, { status: 503 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(result));

    const response = await ask("What does website handover include?");
    const answer = await response.json();
    expect(response.status).toBe(200);
    expect(answer).toMatchObject({ handoff: true, sources: [{ href: "/association-websites" }] });
    expect(answer.answer).not.toContain("Unverified claim");
  });
});
