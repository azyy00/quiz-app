"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCountdown, useGame, useServerTimeOffset } from "@/lib/useGame";
import Leaderboard from "@/components/Leaderboard";
import Confetti from "@/components/Confetti";
import Champion from "@/components/Champion";
import Avatar from "@/components/Avatar";
import { CheckSmallIcon, CopyIcon, TrophyIcon } from "@/components/icons";
import type { Question } from "@/lib/types";

const OPTION_COLORS = [
  "bg-rose-500 text-white",
  "bg-sky-500 text-white",
  "bg-amber-400 text-black",
  "bg-emerald-500 text-white",
];

export default function HostScreen({
  gameId,
  questions,
}: {
  gameId: string;
  questions: Question[];
}) {
  const { game, players } = useGame(gameId);
  const [answerCount, setAnswerCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const autoRevealed = useRef<number | null>(null);

  const question =
    game && game.current_question_index >= 0
      ? questions[game.current_question_index]
      : null;

  const clockOffset = useServerTimeOffset();
  const remaining = useCountdown(
    game?.question_started_at ?? null,
    question?.time_limit ?? 30,
    clockOffset
  );

  const advance = useCallback(
    async (action: "start" | "reveal" | "next" | "finish") => {
      setBusy(true);
      try {
        const res = await fetch(`/api/games/${gameId}/advance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error(data.error);
        }
      } finally {
        setBusy(false);
      }
    },
    [gameId]
  );

  // Auto-reveal when the timer runs out. Recompute the remaining time
  // from the server timestamp here rather than trusting the countdown
  // state: right after advancing to a new question the countdown still
  // holds the previous question's 0, which would insta-lock the new one.
  useEffect(() => {
    if (
      game?.status !== "question" ||
      !question ||
      !game.question_started_at ||
      autoRevealed.current === game.current_question_index
    ) {
      return;
    }
    const elapsedSec =
      (Date.now() + clockOffset - new Date(game.question_started_at).getTime()) /
      1000;
    if (elapsedSec >= question.time_limit) {
      autoRevealed.current = game.current_question_index;
      advance("reveal");
    }
  }, [game, question, remaining, clockOffset, advance]);

  // Auto-advance after results appear: 15s between questions, but only a
  // short 3s beat after the last question — no reason to make the winner
  // wait for their podium. The host can still click to skip ahead.
  const AUTO_NEXT_SECONDS = 15;
  const FINAL_RESULTS_SECONDS = 3;
  const [autoNextLeft, setAutoNextLeft] = useState(AUTO_NEXT_SECONDS);
  useEffect(() => {
    if (game?.status !== "reveal") return;
    const secs =
      game.current_question_index >= questions.length - 1
        ? FINAL_RESULTS_SECONDS
        : AUTO_NEXT_SECONDS;
    setAutoNextLeft(secs);
    const startedMs = Date.now();
    let fired = false;
    const id = setInterval(() => {
      const left = secs - (Date.now() - startedMs) / 1000;
      setAutoNextLeft(Math.max(0, Math.ceil(left)));
      if (left <= 0 && !fired) {
        fired = true;
        clearInterval(id);
        advance("next");
      }
    }, 250);
    return () => clearInterval(id);
  }, [game?.status, game?.current_question_index, questions.length, advance]);

  // Live answer count for the current question
  useEffect(() => {
    if (!question || game?.status !== "question") {
      setAnswerCount(0);
      return;
    }
    const supabase = createClient();
    let cancelled = false;
    const refresh = () =>
      supabase
        .from("answers")
        .select("*", { count: "exact", head: true })
        .eq("question_id", question.id)
        .then(({ count }) => {
          if (!cancelled) setAnswerCount(count ?? 0);
        });
    refresh();
    const id = setInterval(refresh, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [question, game?.status]);

  if (!game) {
    return (
      <main className="flex min-h-dvh animate-pulse items-center justify-center font-black text-zinc-500">
        Loading game…
      </main>
    );
  }

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${game.pin}`
      : `/join/${game.pin}`;

  // ---------- LOBBY ----------
  if (game.status === "lobby") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center gap-6 px-4 py-10">
        <p className="font-bold uppercase tracking-wide text-zinc-500">
          Players join at
        </p>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(joinUrl).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          title={copied ? "Copied!" : "Click to copy link"}
          className={`flex max-w-full items-center gap-2 rounded-2xl border border-zinc-800 bg-card px-4 py-3 text-sm font-bold shadow transition-colors sm:px-6 sm:text-base ${
            copied ? "text-emerald-400" : "text-brand hover:text-white"
          }`}
        >
          <span className="min-w-0 break-all">{joinUrl}</span>
          {copied ? (
            <CheckSmallIcon className="pop-in h-5 w-5" />
          ) : (
            <CopyIcon className="h-5 w-5" />
          )}
        </button>
        <div className="w-full max-w-sm rounded-3xl bg-brand px-6 py-6 text-center shadow-xl sm:px-10">
          <p className="text-sm font-bold uppercase text-violet-200">
            Game code
          </p>
          <p className="text-5xl font-black tracking-widest text-white sm:text-6xl">
            {game.pin}
          </p>
        </div>

        <div className="w-full">
          <h2 className="mb-3 text-center text-xl font-extrabold">
            {players.length} player{players.length === 1 ? "" : "s"} in the
            lobby
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-2 rounded-full border border-zinc-800 bg-card py-1.5 pl-1.5 pr-4 font-bold shadow"
              >
                <Avatar seed={p.nickname} className="h-8 w-8" />
                {p.nickname}
                {p.is_guest && (
                  <span className="ml-1 text-xs font-bold text-zinc-500">
                    Guest
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => advance("start")}
          disabled={busy || players.length === 0}
          className="mt-auto rounded-full bg-emerald-500 px-10 py-4 text-xl font-black text-white shadow-lg hover:bg-emerald-600 disabled:opacity-40"
        >
          Start quiz →
        </button>
      </main>
    );
  }

  // ---------- FINISHED ----------
  if (game.status === "finished") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 px-4 py-10">
        <Confetti count={260} duration={4500} />
        <h1 className="flex items-center gap-3 text-4xl font-black">
          <TrophyIcon className="h-10 w-10" /> Final results
        </h1>
        {players.length > 0 && (
          <Champion
            name={
              [...players].sort((a, b) => b.score - a.score)[0].nickname
            }
          />
        )}
        <Leaderboard players={players} />
        <Link
          href="/dashboard"
          className="rounded-full bg-brand px-8 py-3 font-extrabold text-white hover:bg-brand-dark"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (!question) return null;
  const isReveal = game.status === "reveal";
  const isLast = game.current_question_index >= questions.length - 1;

  // ---------- QUESTION / REVEAL ----------
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between font-extrabold text-zinc-400">
        <span>
          Question {game.current_question_index + 1} / {questions.length}
        </span>
        {game.status === "question" ? (
          <span
            className={`rounded-full px-4 py-1.5 text-lg font-black tabular-nums text-white ${
              remaining <= 5 ? "bg-red-500" : "bg-brand"
            }`}
          >
            {Math.ceil(remaining)}s
          </span>
        ) : (
          <span className="rounded-full bg-zinc-700 px-4 py-1.5 font-black">
            Answers locked
          </span>
        )}
      </header>

      <h1 className="rounded-3xl border border-zinc-800 bg-card p-6 text-center text-2xl font-black shadow sm:p-8 sm:text-3xl">
        {question.text}
      </h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correct_index;
          return (
            <div
              key={i}
              className={`rounded-2xl p-5 text-lg font-extrabold shadow transition-all ${
                OPTION_COLORS[i % OPTION_COLORS.length]
              } ${isReveal && !isCorrect ? "opacity-30" : ""}`}
            >
              {opt}
              {isReveal && isCorrect && " ✓"}
            </div>
          );
        })}
      </div>

      {game.status === "question" && (
        <p className="text-center font-bold text-zinc-400">
          {answerCount} / {players.length} answered
        </p>
      )}

      <div>
        <h2 className="mb-2 text-center font-extrabold text-zinc-400">
          {game.status === "question" ? "Live race" : "Leaderboard"}
        </h2>
        <Leaderboard players={players} limit={8} />
      </div>

      <div className="mt-auto flex justify-center gap-3">
        {game.status === "question" && (
          <button
            onClick={() => advance("reveal")}
            disabled={busy}
            className="rounded-full bg-amber-500 px-8 py-3 text-lg font-black text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Lock &amp; reveal
          </button>
        )}
        {isReveal && (
          <button
            onClick={() => advance("next")}
            disabled={busy}
            className="rounded-full bg-emerald-500 px-8 py-3 text-lg font-black text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {isLast
              ? `Final results in ${autoNextLeft}s (tap to skip)`
              : `Next question in ${autoNextLeft}s → (tap to skip)`}
          </button>
        )}
      </div>
    </main>
  );
}
