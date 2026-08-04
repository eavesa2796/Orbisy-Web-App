"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    if (error) {
      setMessage("Sign-in failed. Check your credentials and try again.");
      setLoading(false);
      return;
    }
    window.location.assign("/admin-portal");
  }

  async function resetPassword() {
    const supabase = createSupabaseBrowserClient();
    const email = (document.querySelector("#admin-email") as HTMLInputElement)
      ?.value;
    if (!supabase || !email) {
      setMessage("Enter your administrator email first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    setMessage(
      error
        ? "Password reset could not be started."
        : "If this is the administrator account, a reset link has been requested.",
    );
  }

  return (
    <div className="login-card">
      <div className="login-icon"><LockKeyhole size={22} /></div>
      <p className="admin-kicker">Administrator sign in</p>
      <h1>Welcome back.</h1>
      <p>Use your approved administrator account to continue.</p>

      {!configured ? (
        <div className="admin-notice" role="status">
          Authentication is not configured. Add the documented Supabase
          environment variables to enable administrator sign-in.
        </div>
      ) : (
        <form onSubmit={login}>
          <label>
            Email
            <input id="admin-email" name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {message && <p className="login-message" role="status">{message}</p>}
          <button className="button" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button className="reset-link" type="button" onClick={resetPassword}>
            Forgot password?
          </button>
        </form>
      )}
    </div>
  );
}
