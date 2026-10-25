export const siteConfig = {
  name: "Orbisy",
  owner: "Anthony Eaves",
  email: "info@orbisy.com",
  location: "Chicago, Illinois",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://orbisy.com",
  description:
    "Orbisy builds websites and custom software, manages Google Ads and local SEO, and connects inquiries with automated follow-up for restaurants, home services, towing, and other local businesses. Based in Chicago.",
} as const;

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL);
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
