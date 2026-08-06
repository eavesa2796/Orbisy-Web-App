export const siteConfig = {
  name: "Orbisy",
  owner: "Anthony Eaves",
  email: "info@orbisy.com",
  location: "Chicago, Illinois",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Orbisy organizes grease-interceptor service tickets, supporting evidence, missing records, and upcoming service dates for restaurant operators and grease haulers.",
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
