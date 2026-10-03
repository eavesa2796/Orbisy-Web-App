import type { Metadata } from "next";
import { engagements } from "@/lib/engagements";
import { EngagementPage } from "@/components/engagement-page";
const engagement = engagements[0];
export const metadata: Metadata = {
  title: engagement.title,
  description: engagement.description,
  alternates: { canonical: "/web-design" },
  openGraph: {
    title: engagement.title,
    description: engagement.description,
    url: "/web-design",
  },
};
export default function Page() {
  return <EngagementPage engagement={engagement} />;
}
