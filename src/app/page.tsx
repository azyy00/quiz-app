import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Brand from "@/components/Brand";

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
        <Brand />
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
                className="rounded-full px-5 py-2 font-bold text-brand hover:bg-zinc-800"
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

      <section className="mx-auto grid w-full max-w-5xl flex-1 content-center gap-12 px-6 pb-24 pt-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="flex flex-col gap-6 text-center lg:text-left">
          <h1 className="text-5xl font-black leading-tight sm:text-6xl">
            Live quizzes,{" "}
            <span className="text-brand">zero friction</span>
          </h1>
          <p className="mx-auto max-w-md text-lg text-zinc-400 lg:mx-0">
            Create a quiz, share one link, and watch the leaderboard update
            live. Guests just pick a nickname.
          </p>
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="mx-auto w-fit rounded-full bg-brand px-7 py-3 font-extrabold text-white hover:bg-brand-dark lg:mx-0"
          >
            Create a quiz
          </Link>
        </div>

        <form
          action={joinByCode}
          className="flex w-full flex-col gap-4 rounded-3xl border border-zinc-800 bg-card p-8 shadow-xl"
        >
          <p className="text-center text-sm font-bold uppercase tracking-wide text-zinc-500">
            Got a game code?
          </p>
          <input
            name="code"
            required
            maxLength={6}
            inputMode="numeric"
            placeholder="123456"
            className="rounded-xl border-2 border-zinc-700 px-5 py-4 text-center text-3xl font-black tracking-[0.3em] outline-none placeholder:text-zinc-700 focus:border-brand"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 py-4 text-lg font-black text-white hover:bg-emerald-600"
          >
            Join game
          </button>
        </form>
      </section>
    </main>
  );
}
