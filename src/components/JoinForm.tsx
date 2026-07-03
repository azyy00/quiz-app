"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JoinForm({
  pin,
  isLoggedIn,
  defaultNickname,
}: {
  pin: string;
  isLoggedIn: boolean;
  defaultNickname: string;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(defaultNickname);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/games/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, nickname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join");
      // Remember who we are for this game (guests have no session)
      localStorage.setItem(`quiz-player-${data.gameId}`, data.player.id);
      router.push(`/play/${data.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
      setLoading(false);
    }
  }

  const joinPath = `/join/${encodeURIComponent(pin)}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-xl">
        <p className="mb-1 text-center text-sm font-bold uppercase tracking-wide text-zinc-500">
          Joining game
        </p>
        <p className="mb-6 text-center text-4xl font-black tracking-widest text-brand">
          {pin}
        </p>

        <form onSubmit={join} className="flex flex-col gap-3">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            maxLength={20}
            placeholder="Your nickname"
            className="rounded-xl border-2 border-zinc-700 px-4 py-3 text-center text-lg font-extrabold outline-none focus:border-brand"
          />
          {error && (
            <p className="rounded-lg bg-red-950 px-3 py-2 text-sm font-semibold text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand py-3 text-lg font-extrabold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading
              ? "Joining…"
              : isLoggedIn
                ? "Join game"
                : "Join as guest"}
          </button>
        </form>

        {!isLoggedIn && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs font-bold text-zinc-500">
              <div className="h-px flex-1 bg-zinc-700" /> OR
              <div className="h-px flex-1 bg-zinc-700" />
            </div>
            <div className="flex gap-2">
              <Link
                href={`/login?next=${encodeURIComponent(joinPath)}`}
                className="flex-1 rounded-xl border-2 border-zinc-700 py-2.5 text-center font-bold hover:bg-zinc-800"
              >
                Log in
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(joinPath)}`}
                className="flex-1 rounded-xl border-2 border-zinc-700 py-2.5 text-center font-bold hover:bg-zinc-800"
              >
                Register
              </Link>
            </div>
            <p className="mt-3 text-center text-xs font-semibold text-zinc-500">
              Guests only need a nickname — you&apos;ll show up as “Guest” on
              the leaderboard.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
