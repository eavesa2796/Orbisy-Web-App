import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { OrbisyLogo } from "@/components/orbisy-logo";
import { getAdminIdentity } from "@/lib/auth";
import { hasSupabaseConfig } from "@/lib/config";

export default async function AdminPortalPage() {
  if (await getAdminIdentity()) redirect("/admin-portal/dashboard");

  return (
    <main className="login-page" id="main-content">
      <section className="login-intro" aria-labelledby="login-intro-title">
        <OrbisyLogo className="login-logo" priority />
        <p className="admin-kicker">Private administrator workspace</p>
        <h1 id="login-intro-title">
          Turn first conversations into <span>focused pilots.</span>
        </h1>
        <p>
          Manage hauler prospects, restaurant inquiries, call attempts,
          workflow reviews, pilot proposals, and every scheduled follow-up.
        </p>
      </section>
      <LoginForm configured={hasSupabaseConfig()} />
    </main>
  );
}
