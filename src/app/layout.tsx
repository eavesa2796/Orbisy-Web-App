import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { siteConfig } from "@/lib/config";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Orbisy — Grease-interceptor service records for restaurant operators",
    template: "%s | Orbisy",
  },
  description: siteConfig.description,
  applicationName: "Orbisy",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Orbisy",
    url: "/",
    title: "Orbisy — Grease-interceptor service records for restaurant operators",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbisy — Grease-interceptor service records for restaurant operators",
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0e1220",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
