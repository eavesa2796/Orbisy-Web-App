import type { Metadata } from "next";
import { engagements } from "@/lib/engagements";
import { EngagementPage } from "@/components/engagement-page";
const engagement = engagements.find(
  (item) => item.slug === "automated-follow-up",
)!;
export const metadata: Metadata = {
  title: engagement.title,
  description: engagement.description,
  alternates: { canonical: "/automated-follow-up" },
  openGraph: {
    title: engagement.title,
    description: engagement.description,
    url: "/automated-follow-up",
  },
};
export default function Page() {
  return <EngagementPage engagement={engagement} />;
}
