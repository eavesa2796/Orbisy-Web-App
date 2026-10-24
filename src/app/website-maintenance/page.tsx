import type { Metadata } from "next";
import { engagements } from "@/lib/engagements";
import { EngagementPage } from "@/components/engagement-page";
const engagement = engagements.find(
  (item) => item.slug === "website-maintenance",
)!;
export const metadata: Metadata = {
  title: engagement.title,
  description: engagement.description,
  alternates: { canonical: "/website-maintenance" },
  openGraph: {
    title: engagement.title,
    description: engagement.description,
    url: "/website-maintenance",
  },
};
export default function Page() {
  return <EngagementPage engagement={engagement} />;
}
