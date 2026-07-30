"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  return (
    <main className="login-page" id="main-content">
      <div className="login-card">
        <p className="admin-kicker">Administrator security</p>
        <h1>Set a new password.</h1>
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
