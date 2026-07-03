"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      // If email confirmation is enabled there's no session yet.
      if (!data.session) {
        setNotice("Check your email to confirm your account, then log in.");
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) return setError(error.message);
    }
    router.push(next);
    router.refresh();
  }

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const site =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <Link href="/" className="mb-6 block text-center text-2xl font-black text-brand">
          QuizBlitz
        </Link>
        <h1 className="mb-6 text-center text-xl font-extrabold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold outline-none focus:border-brand"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            className="rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold outline-none focus:border-brand"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {notice}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand py-3 font-extrabold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs font-bold text-slate-400">
          <div className="h-px flex-1 bg-slate-200" /> OR
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full rounded-xl border-2 border-slate-200 py-3 font-extrabold hover:bg-slate-50"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm font-semibold text-slate-500">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-brand underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
