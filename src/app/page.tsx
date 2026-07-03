import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function joinByCode(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim();
  if (code) redirect(`/join/${encodeURIComponent(code)}`);
}

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-2xl font-black text-brand">QuizBlitz</span>
        <nav className="flex gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-brand px-5 py-2 font-bold text-white hover:bg-brand-dark"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-5 py-2 font-bold text-brand hover:bg-violet-100"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-brand px-5 py-2 font-bold text-white hover:bg-brand-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 text-center">
        <h1 className="max-w-2xl text-5xl font-black leading-tight sm:text-6xl">
          Live quizzes, <span className="text-brand">zero friction</span>
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
          Create a quiz, share one link, and watch the leaderboard update in
          real time. Players can join as guests — no account needed.
        </p>

        <form
          action={joinByCode}
          className="flex w-full max-w-md overflow-hidden rounded-2xl border-4 border-brand bg-white shadow-lg"
        >
          <input
            name="code"
            required
            maxLength={6}
            inputMode="numeric"
            placeholder="Enter game code"
            className="flex-1 px-5 py-4 text-center text-2xl font-extrabold tracking-widest outline-none placeholder:text-slate-300"
          />
          <button
            type="submit"
            className="bg-brand px-8 text-lg font-extrabold text-white hover:bg-brand-dark"
          >
            Join
          </button>
        </form>

        <Link
          href={user ? "/dashboard" : "/signup"}
          className="font-bold text-brand underline underline-offset-4"
        >
          or create your own quiz →
        </Link>
      </section>
    </main>
  );
}
