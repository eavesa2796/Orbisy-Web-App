import type { Metadata } from "next";
import { engagements } from "@/lib/engagements";
import { EngagementPage } from "@/components/engagement-page";
const engagement = engagements[1];
export const metadata: Metadata = {
  title: engagement.title,
  description: engagement.description,
  alternates: { canonical: "/google-ads" },
  openGraph: {
    title: engagement.title,
    description: engagement.description,
    url: "/google-ads",
  },
};
export default function Page() {
  return <EngagementPage engagement={engagement} />;
}
