import type { Metadata } from "next";
import { engagements } from "@/lib/engagements";
import { EngagementPage } from "@/components/engagement-page";
const engagement = engagements[3];
export const metadata: Metadata = {
  title: engagement.title,
  description: engagement.description,
  alternates: { canonical: "/custom-development" },
  openGraph: {
    title: engagement.title,
    description: engagement.description,
    url: "/custom-development",
  },
};
export default function Page() {
  return <EngagementPage engagement={engagement} />;
}
