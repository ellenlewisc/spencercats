"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = getBrowserClient().auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/");
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await getBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError(
        signInError.status === 400
          ? "That email and password don't match."
          : "Couldn't sign in right now. Please try again in a minute.",
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border-2 border-ink bg-blush px-4 py-2.5 text-sm font-semibold">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
