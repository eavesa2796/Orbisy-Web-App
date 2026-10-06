import type { Metadata } from "next";
import { engagements } from "@/lib/engagements";
import { EngagementPage } from "@/components/engagement-page";
const engagement = engagements[2];
export const metadata: Metadata = {
  title: engagement.title,
  description: engagement.description,
  alternates: { canonical: "/local-seo" },
  openGraph: {
    title: engagement.title,
    description: engagement.description,
    url: "/local-seo",
  },
};
export default function Page() {
  return <EngagementPage engagement={engagement} />;
}
