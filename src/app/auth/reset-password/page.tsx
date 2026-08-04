"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { OrbisyLogo } from "@/components/orbisy-logo";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  return (
    <main className="login-page" id="main-content">
      <section className="login-intro" aria-labelledby="reset-intro-title">
        <OrbisyLogo className="login-logo" priority />
        <p className="admin-kicker">Private administrator workspace</p>
        <h1 id="reset-intro-title">Secure access, <span>carefully restored.</span></h1>
        <p>Choose a strong password that is unique to your Orbisy administrator account.</p>
      </section>
      <div className="login-card">
        <div className="login-icon"><LockKeyhole size={22} /></div>
        <p className="admin-kicker">Administrator security</p>
        <h1>Set a new password.</h1>
        <p>Your new password must contain at least 12 characters.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const password = String(form.get("password"));
            if (password.length < 12) {
              setMessage("Use at least 12 characters.");
              return;
            }
            const { error } =
              (await createSupabaseBrowserClient()?.auth.updateUser({ password })) ??
              { error: new Error("Authentication unavailable") };
            if (error) setMessage("The password could not be updated.");
            else window.location.assign("/admin-portal");
          }}
        >
          <label>New password<input name="password" type="password" minLength={12} required /></label>
          {message && <p role="alert">{message}</p>}
          <button className="button" type="submit">Update password</button>
        </form>
      </div>
    </main>
  );
}
