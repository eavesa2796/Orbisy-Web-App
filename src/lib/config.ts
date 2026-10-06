export const siteConfig = {
  name: "Orbisy",
  owner: "Anthony Eaves",
  email: "info@orbisy.com",
  location: "Chicago, Illinois",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://orbisy.com",
  description:
    "Orbisy provides web design, Google Ads management, local SEO, and custom development for towing, roadside assistance, and other service businesses. Based in Chicago.",
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
