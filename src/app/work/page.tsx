import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
import { AgencyContact } from "@/components/agency-contact";
export const metadata: Metadata = {
  title: "Selected website work",
  description:
    "Explore Anthony Eaves’s website work for Rescue Battery Shop and Rescue Tow Truck.",
  alternates: { canonical: "/work" },
  openGraph: { url: "/work" },
};
export default function Page() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <Portfolio full />
        <AgencyContact />
      </main>
      <PublicFooter />
    </>
  );
}
