"use client";

import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  return (
    <button
      className="admin-logout"
      onClick={async () => {
        await createSupabaseBrowserClient()?.auth.signOut();
        window.location.assign("/admin-portal");
      }}
      type="button"
    >
      <LogOut size={15} /> Log out
    </button>
  );
}
