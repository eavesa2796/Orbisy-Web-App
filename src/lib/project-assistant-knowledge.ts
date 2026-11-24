import "server-only";
import { associationServices, associationFaqs, platformFamiliarity, engagementProcess } from "@/lib/association-services";
import { discoveryOffer, pricingAddOns, publicPackages, supportingOffers } from "@/lib/public-pricing";
import { getPublicKnowledge } from "@/lib/data/knowledge-base";
import { knowledgePassages } from "@/lib/knowledge-base";

export type AssistantPassage = {
  id: string;
  title: string;
  source: string;
  text: string;
};

const staticPassages: AssistantPassage[] = [
  {
    id: "site-overview",
    title: "Orbisy overview",
    source: "/",
    text: "Orbisy LLC is an independent development business based in Chicago, Illinois, started in 2026. It builds custom association websites, member functionality, and scoped integrations around organizational workflows and existing systems. Clients work directly with an Orbisy developer. Orbisy's current portfolio includes real website work and clearly labeled concepts. Association case studies and finished association software products are not claimed.",
  },
  {
    id: "association-approach",
    title: "The association approach",
    source: "/associations",
    text: "Projects start with the needs of members, prospective members, event teams, staff, committees, sponsors, and volunteers. Discovery reviews content, editing roles, membership status and source of truth, event registration, available APIs, identity options, account editions, permissions, test environments, and vendor requirements. A link or focused feature may fit better than a larger integration.",
  },
  {
    id: "about-orbisy",
    title: "About Orbisy",
    source: "/about",
    text: "Orbisy is an independent development business based in Chicago and working remotely. The developer works directly with clients on discovery, design, development, testing, and handover. Development skills include React, TypeScript, and modern web frameworks. Tool selection follows content editing needs, existing systems, and maintenance requirements. Project schedules and support arrangements reflect the capacity agreed for the work.",
  },
  {
    id: "portfolio",
    title: "Portfolio and experience",
    source: "/work",
    text: "The portfolio includes two client website projects for local businesses, an illustrative association website concept, a design-process concept, and a software dashboard concept in progress. Concepts are identified as concepts. Orbisy does not claim association case studies, formal platform partnerships or certifications, completed association integrations, or a finished association software product. The developer has experience working with associations using membership and event platforms; each proposed connection is assessed for the specific product, APIs, permissions, and vendor requirements.",
  },
  {
    id: "platform-familiarity",
    title: "Platform familiarity",
    source: "/associations",
    text: "Orbisy's platform familiarity describes the developer's experience working with associations using the named platforms. It is not a formal partnership, certification, completed integration, or prebuilt connector. Each proposed connection is assessed against the specific product, available APIs, permissions, and vendor requirements.",
  },
  {
    id: "service-process",
    title: "Project process",
    source: "/project-planning",
    text: engagementProcess.map(([title, description]) => title + ": " + description).join("\n") + "\nA written proposal should define scope, assumptions, responsibilities, dependencies, exclusions, fees, payment milestones, and the project schedule before paid implementation begins.",
  },
  {
    id: "board-review",
    title: "Board and budget review",
    source: "/project-planning",
    text: "Before approval, clarify the audience or staff task, who owns content and approvals, which systems stay in place, what is included and excluded, which costs are one-time or recurring, which dependencies can affect schedule or estimate, and what testing, documentation, training, and post-launch support are included. This guide is planning material, not a quote or delivery-time promise.",
  },
  {
    id: "contact",
    title: "Contact Orbisy",
    source: "/pricing#contact",
    text: "To discuss a project, use the project request form on the pricing page or email info@orbisy.com. Orbisy reviews requests and replies by email to arrange a conversation. Requesting a conversation does not commit the organization to paid work.",
  },
  {
    id: "services-index",
    title: "Services for associations",
    source: "/services",
    text: "Orbisy offers four services for associations: association websites; member portals and custom functionality; integrations and connected systems; and ongoing development and support. Work begins with the workflow and an agreed scope.",
  },
  {
    id: "privacy-basics",
    title: "Privacy and public project requests",
    source: "/privacy",
    text: "Do not submit passwords, API keys, payment details, or confidential member or customer records through public forms or the AI assistant. Project schedules, final fees, platform access, and integration feasibility are confirmed through an individually reviewed scope.",
  },
];

function splitLongText(text: string, maxLength = 1100) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const result: string[] = [];
  for (const block of blocks) {
    if (block.length <= maxLength) {
      result.push(block);
      continue;
    }
    for (let start = 0; start < block.length; start += maxLength)
      result.push(block.slice(start, start + maxLength));
  }
  return result;
}

export async function getAssistantPassages(): Promise<AssistantPassage[]> {
  const passages = [...staticPassages];
  for (const service of associationServices) {
    const details = [
      service.description,
      service.headline,
      service.intro,
      "What the project can include: " + service.deliverables.join("; "),
      "What Orbisy needs from the association: " + service.responsibilities,
      "How scope and price work: " + service.scope,
    ].join("\n\n");
    passages.push({
      id: service.slug + "-overview",
      title: service.title,
      source: "/" + service.slug,
      text: details,
    });
    service.faq.forEach(([question, answer], index) => {
      passages.push({
        id: service.slug + "-faq-" + index,
        title: service.title + ": " + question,
        source: "/" + service.slug,
        text: question + "\n" + answer,
      });
    });
  }

  associationFaqs.forEach(([question, answer], index) => {
    passages.push({
      id: "home-faq-" + index,
      title: question,
      source: "/#faq",
      text: question + "\n" + answer,
    });
  });

  platformFamiliarity.forEach((platform, index) => {
    passages.push({
      id: "platform-" + index,
      title: "Platform familiarity",
      source: "/associations",
      text: "Orbisy's developer has experience working with associations using " + platform + ". This is platform familiarity only, not a partnership, certification, completed integration, or prebuilt connector. A proposed connection is assessed for the specific product, API availability, permissions, and vendor requirements.",
    });
  });

  publicPackages.forEach((offer) => {
    passages.push({
      id: "price-" + offer.id,
      title: offer.name + " planning range",
      source: "/pricing",
      text: offer.name + ": " + offer.price + " " + offer.billing + ". " + offer.description + " " + offer.scope + " These are planning ranges, not fixed quotes; the proposal confirms final fees after scope, content, access, and dependencies are reviewed.",
    });
  });

  supportingOffers.forEach((offer) => {
    passages.push({
      id: "support-" + offer.id,
      title: offer.name,
      source: "/pricing",
      text: offer.name + ": " + offer.price + " " + offer.billing + ". " + offer.description + " " + offer.scope,
    });
  });

  passages.push({
    id: "discovery",
    title: discoveryOffer.name,
    source: "/pricing",
    text: discoveryOffer.name + ": " + discoveryOffer.price + " " + discoveryOffer.billing + ". " + discoveryOffer.description + " " + discoveryOffer.scope,
  });

  pricingAddOns.forEach(([title, copy], index) => {
    passages.push({
      id: "pricing-add-on-" + index,
      title,
      source: "/pricing",
      text: title + ": " + copy,
    });
  });

  try {
    const articles = await getPublicKnowledge();
    for (const article of articles) {
      for (const passage of knowledgePassages(article)) {
        passages.push({
          id: passage.id,
          title: article.title,
          source: passage.source,
          text: "Public Orbisy knowledge base article, reviewed " + article.reviewedOn + ". " + passage.text,
        });
      }
    }
  } catch {
    // Keep the public static site content available if the article database is unavailable.
  }

  return passages.flatMap((passage) =>
    splitLongText(passage.text).map((text, index, blocks) => ({
      ...passage,
      id: blocks.length > 1 ? passage.id + "-" + index : passage.id,
      text,
    })),
  );
}

const stopWords = new Set([
  "about", "after", "also", "and", "are", "can", "could", "does", "for", "from",
  "have", "how", "into", "its", "just", "like", "more", "most", "need", "our",
  "that", "the", "their", "them", "then", "there", "these", "they", "this",
  "what", "when", "which", "who", "will", "with", "would", "your",
]);

function terms(value: string) {
  return value.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter((term) => !stopWords.has(term)) ?? [];
}

export function findAssistantSources(passages: AssistantPassage[], query: string, pagePath = "") {
  const queryTerms = [...new Set(terms(query))];
  if (queryTerms.length === 0) return [];
  return passages
    .map((passage) => {
      const title = terms(passage.title);
      const body = terms(passage.text);
      let score = 0;
      for (const term of queryTerms) {
        const titleCount = title.filter((item) => item === term).length;
        const bodyCount = body.filter((item) => item === term).length;
        score += titleCount * 4 + Math.min(bodyCount, 4);
      }
      if (score > 0 && pagePath && passage.source.split("#")[0] === pagePath) score += 2;
      return { passage, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((item) => ({ passage: item.passage, score: item.score }));
}
