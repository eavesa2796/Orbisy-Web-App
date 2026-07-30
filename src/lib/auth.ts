import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminIdentity = {
  id: string;
  email: string;
};

export const getAdminIdentity = cache(async (): Promise<AdminIdentity | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const email = user?.email?.trim().toLowerCase();

  if (!user || !email || !adminEmail || email !== adminEmail) return null;
  return { id: user.id, email };
});

export async function requireAdmin() {
  const admin = await getAdminIdentity();
  if (!admin) redirect("/admin-portal");
  return admin;
}
