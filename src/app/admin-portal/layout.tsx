import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Administrator",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
