export const siteConfig = {
  name: "Orbisy",
  owner: "Anthony Eaves",
  email: "info@orbisy.com",
  location: "Chicago, Illinois",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://orbisy.com",
  description:
    "Custom websites, member portals, and scoped software integrations for associations. Independent development based in Chicago.",
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
