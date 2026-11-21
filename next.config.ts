import type { NextConfig } from "next";
import { legacyPublicRedirects } from "./src/lib/public-route-redirects";

const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : "";
  } catch {
    return "";
  }
})();

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://region1.google-analytics.com",
  "font-src 'self' data:",
  `connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    taint: true,
  },
  async redirects() {
    return legacyPublicRedirects;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        // Chrome also checks the redirect destination after an OAuth form POST.
        // Only this private inbox needs to navigate a form to Google's sign-in.
        source: "/admin-portal/followups",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy.replace(
              "form-action 'self'",
              "form-action 'self' https://accounts.google.com",
            ),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
