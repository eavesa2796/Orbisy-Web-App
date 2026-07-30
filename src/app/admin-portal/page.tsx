import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminIdentity } from "@/lib/auth";
import { hasSupabaseConfig } from "@/lib/config";

export default async function AdminPortalPage() {
  if (await getAdminIdentity()) redirect("/admin-portal/dashboard");

  return (
    <main className="login-page" id="main-content">
      <LoginForm configured={hasSupabaseConfig()} />
    </main>
  );
}
