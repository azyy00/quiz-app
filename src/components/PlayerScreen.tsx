"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCountdown, useGame } from "@/lib/useGame";
import Leaderboard from "@/components/Leaderboard";
import Confetti from "@/components/Confetti";
import type { PublicQuestion } from "@/lib/types";

const OPTION_COLORS = [
  "bg-rose-500 hover:bg-rose-600",
  "bg-sky-500 hover:bg-sky-600",
  "bg-amber-500 hover:bg-amber-600",
  "bg-emerald-500 hover:bg-emerald-600",
];

interface QuestionPayload {
  question: PublicQuestion & { correct_index?: number };
  started_at: string | null;
  status: string;
  myAnswer: {
    answer_index: number;
    is_correct: boolean;
    points_awarded: number;
  } | null;
}

export default function PlayerScreen({ gameId }: { gameId: string }) {
  const { game, players } = useGame(gameId);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [payload, setPayload] = useState<QuestionPayload | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setPlayerId(localStorage.getItem(`quiz-player-${gameId}`));
  }, [gameId]);

  const me = useMemo(
    () => players.find((p) => p.id === playerId) ?? null,
    [players, playerId]
  );
  const myRank = useMemo(() => {
    if (!me) return null;
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return sorted.findIndex((p) => p.id === me.id) + 1;
  }, [players, me]);

  // Fetch the current question whenever the game moves
  useEffect(() => {
    if (!game || game.current_question_index < 0) return;
    if (game.status !== "question" && game.status !== "reveal") return;
    let cancelled = false;
    fetch(
      `/api/games/${gameId}/question${playerId ? `?playerId=${playerId}` : ""}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.question) setPayload(data);
      });
    return () => {
      cancelled = true;
    };
  }, [game?.status, game?.current_question_index, gameId, playerId, game]);

  // Reset choice when a new question starts
  useEffect(() => {
    setChosen(null);
    setSubmitError(null);
  }, [game?.current_question_index]);

  // Mirror the host's 15s auto-next countdown on the results screen.
  // Display-only: the host screen actually advances the game.
  const AUTO_NEXT_SECONDS = 15;
  const [autoNextLeft, setAutoNextLeft] = useState(AUTO_NEXT_SECONDS);
  useEffect(() => {
    if (game?.status !== "reveal") return;
    setAutoNextLeft(AUTO_NEXT_SECONDS);
    const startedMs = Date.now();
    const id = setInterval(() => {
      const left = AUTO_NEXT_SECONDS - (Date.now() - startedMs) / 1000;
      setAutoNextLeft(Math.max(0, Math.ceil(left)));
      if (left <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [game?.status, game?.current_question_index]);

  const remaining = useCountdown(
    game?.question_started_at ?? null,
    payload?.question.time_limit ?? 30
  );

  const submit = useCallback(
    async (answerIndex: number) => {
      if (!playerId || chosen !== null) return;
      setChosen(answerIndex);
      const res = await fetch(`/api/games/${gameId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, answerIndex }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "Could not submit answer");
      }
    },
    [gameId, playerId, chosen]
  );

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center font-black text-slate-400">
        Loading…
      </main>
    );
  }

  if (!playerId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-xl font-extrabold">You haven&apos;t joined this game.</p>
        <Link
          href={`/join/${game.pin}`}
          className="rounded-full bg-brand px-8 py-3 font-extrabold text-white hover:bg-brand-dark"
        >
          Join with code {game.pin}
        </Link>
      </main>
    );
  }

  // ---------- LOBBY ----------
  if (game.status === "lobby") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="animate-bounce text-5xl">🎮</div>
        <h1 className="text-2xl font-black">You&apos;re in, {me?.nickname}!</h1>
        {me?.is_guest && (
          <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-600">
            Playing as Guest
          </span>
        )}
        <p className="font-bold text-slate-500">
          Waiting for the host to start the quiz…
        </p>
        <p className="text-sm font-semibold text-slate-400">
          {players.length} player{players.length === 1 ? "" : "s"} in the lobby
        </p>
      </main>
    );
  }

  // ---------- FINISHED ----------
  if (game.status === "finished") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center gap-6 px-4 py-10">
        {myRank !== null && myRank <= 3 && (
          <Confetti count={220} duration={4000} />
        )}
        <h1 className="text-4xl font-black">🏆 Final results</h1>
        {me && myRank && (
          <p className="text-xl font-extrabold">
            You finished <span className="text-brand">#{myRank}</span> with{" "}
            {me.score} points
          </p>
        )}
        <Leaderboard players={players} highlightId={playerId} />
        <Link href="/" className="font-bold text-brand underline">
          Play another quiz
        </Link>
      </main>
    );
  }

  const q = payload?.question;
  if (!q || payload.question.order_index !== game.current_question_index) {
    return (
      <main className="flex min-h-screen items-center justify-center font-black text-slate-400">
        Get ready…
      </main>
    );
  }

  // ---------- REVEAL ----------
  if (game.status === "reveal") {
    const mine = payload.myAnswer;
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-5 px-4 py-10 text-center">
        {mine?.is_correct && (
          <Confetti key={game.current_question_index} />
        )}
        {mine ? (
          mine.is_correct ? (
            <>
              <div className="text-6xl">✅</div>
              <h1 className="text-3xl font-black text-emerald-600">Correct!</h1>
              <p className="text-2xl font-extrabold">
                +{mine.points_awarded} points
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl">❌</div>
              <h1 className="text-3xl font-black text-red-500">Wrong</h1>
              <p className="font-bold text-slate-500">
                Correct answer:{" "}
                <span className="text-slate-900">
                  {q.options[q.correct_index ?? 0]}
                </span>
              </p>
            </>
          )
        ) : (
          <>
            <div className="text-6xl">⏰</div>
            <h1 className="text-3xl font-black text-slate-500">
              Time&apos;s up — no answer
            </h1>
            <p className="font-bold text-slate-500">
              Correct answer:{" "}
              <span className="text-slate-900">
                {q.options[q.correct_index ?? 0]}
              </span>
            </p>
          </>
        )}

        {me && myRank && (
          <p className="rounded-full bg-white px-6 py-2 font-extrabold shadow">
            #{myRank} · {me.score} pts
          </p>
        )}
        <div className="w-full">
          <Leaderboard players={players} highlightId={playerId} limit={5} />
        </div>
        <p className="text-sm font-bold text-slate-400">
          {autoNextLeft > 0
            ? `Next question in ${autoNextLeft}s…`
            : "Get ready…"}
        </p>
      </main>
    );
  }

  // ---------- LIVE QUESTION ----------
  const answered = chosen !== null;
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between font-extrabold text-slate-500">
        <span>Q{game.current_question_index + 1}</span>
        <span
          className={`rounded-full px-4 py-1.5 text-lg font-black tabular-nums text-white ${
            remaining <= 5 ? "bg-red-500" : "bg-brand"
          }`}
        >
          {Math.ceil(remaining)}s
        </span>
      </header>

      <h1 className="rounded-3xl bg-white p-6 text-center text-2xl font-black shadow">
        {q.text}
      </h1>

      {answered ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="text-5xl">🤞</div>
          <p className="text-xl font-black">Answer locked in!</p>
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {submitError}
            </p>
          )}
          <p className="font-bold text-slate-500">
            Waiting for everyone else…
          </p>
        </div>
      ) : remaining <= 0 ? (
        <p className="flex-1 content-center text-center text-xl font-black text-slate-500">
          ⏰ Time&apos;s up!
        </p>
      ) : (
        <div className="grid flex-1 content-start gap-3 sm:grid-cols-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => submit(i)}
              className={`min-h-[70px] rounded-2xl p-5 text-lg font-extrabold text-white shadow transition-transform active:scale-95 ${
                OPTION_COLORS[i % OPTION_COLORS.length]
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
