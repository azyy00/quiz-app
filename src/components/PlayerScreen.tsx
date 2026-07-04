"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCountdown, useGame, useServerTimeOffset } from "@/lib/useGame";
import Leaderboard from "@/components/Leaderboard";
import Confetti from "@/components/Confetti";
import Champion from "@/components/Champion";
import Avatar from "@/components/Avatar";
import {
  BoltIcon,
  CheckIcon,
  ClockIcon,
  CrossIcon,
  FlameIcon,
  TrophyIcon,
} from "@/components/icons";
import type { PublicQuestion } from "@/lib/types";

const OPTION_COLORS = [
  "bg-rose-500 text-white hover:brightness-110",
  "bg-sky-500 text-white hover:brightness-110",
  "bg-amber-400 text-black hover:brightness-110",
  "bg-emerald-500 text-white hover:brightness-110",
];

interface QuestionPayload {
  question: PublicQuestion & { correct_index?: number };
  started_at: string | null;
  status: string;
  total: number;
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

  // Consecutive-correct streak, counted once per revealed question
  const [streak, setStreak] = useState(0);
  const lastCounted = useRef<number | null>(null);
  useEffect(() => {
    if (game?.status !== "reveal" || !payload) return;
    if (payload.question.order_index !== game.current_question_index) return;
    if (lastCounted.current === game.current_question_index) return;
    lastCounted.current = game.current_question_index;
    setStreak((s) => (payload.myAnswer?.is_correct ? s + 1 : 0));
  }, [game?.status, game?.current_question_index, payload]);

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

  const clockOffset = useServerTimeOffset();
  const remaining = useCountdown(
    game?.question_started_at ?? null,
    payload?.question.time_limit ?? 30,
    clockOffset
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
      <main className="flex min-h-screen items-center justify-center font-black text-zinc-500">
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
        {me && (
          <div className="pop-in">
            <Avatar seed={me.nickname} className="h-24 w-24 shadow-lg" />
          </div>
        )}
        <h1 className="text-2xl font-black">You&apos;re in, {me?.nickname}!</h1>
        {me?.is_guest && (
          <span className="rounded-full bg-zinc-700 px-3 py-1 text-sm font-bold text-zinc-400">
            Playing as Guest
          </span>
        )}
        <p className="font-bold text-zinc-400">
          Waiting for the host to start the quiz…
        </p>
        <p className="text-sm font-semibold text-zinc-500">
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
        <h1 className="flex items-center gap-3 text-4xl font-black">
          <TrophyIcon className="h-10 w-10" /> Final results
        </h1>
        {myRank === 1 && me && <Champion name={me.nickname} />}
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
      <main className="flex min-h-screen items-center justify-center font-black text-zinc-500">
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
              <CheckIcon className="pop-in h-24 w-24" />
              <h1 className="text-3xl font-black text-emerald-400">Correct!</h1>
              <p className="text-2xl font-extrabold">
                +{mine.points_awarded} points
              </p>
              {streak >= 2 && (
                <div className="pop-in flex items-center gap-2 rounded-full bg-orange-950 px-5 py-2 shadow">
                  <FlameIcon
                    className={`flame-flicker ${streak >= 5 ? "h-12 w-12" : "h-9 w-9"}`}
                  />
                  <span className="text-xl font-black text-orange-400">
                    {streak} IN A ROW{streak >= 5 ? "! ON FIRE!" : "!"}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <CrossIcon className="pop-in h-24 w-24" />
              <h1 className="text-3xl font-black text-red-500">Wrong</h1>
              <p className="font-bold text-zinc-400">
                Correct answer:{" "}
                <span className="text-white">
                  {q.options[q.correct_index ?? 0]}
                </span>
              </p>
            </>
          )
        ) : chosen !== null ? (
          <>
            <ClockIcon className="pop-in h-24 w-24" />
            <h1 className="text-3xl font-black text-amber-400">
              Too late!
            </h1>
            <p className="font-bold text-zinc-400">
              Your answer arrived after time ran out, so it didn&apos;t count.
            </p>
            <p className="font-bold text-zinc-400">
              Correct answer:{" "}
              <span className="text-white">
                {q.options[q.correct_index ?? 0]}
              </span>
            </p>
          </>
        ) : (
          <>
            <ClockIcon className="pop-in h-24 w-24 opacity-70" />
            <h1 className="text-3xl font-black text-zinc-400">
              Time&apos;s up, no answer
            </h1>
            <p className="font-bold text-zinc-400">
              Correct answer:{" "}
              <span className="text-white">
                {q.options[q.correct_index ?? 0]}
              </span>
            </p>
          </>
        )}

        {me && myRank && (
          <p className="rounded-full border border-zinc-800 bg-card px-6 py-2 font-extrabold shadow">
            #{myRank} · {me.score} pts
          </p>
        )}
        <div className="w-full">
          <Leaderboard players={players} highlightId={playerId} limit={5} />
        </div>
        <p className="text-sm font-bold text-zinc-500">
          {q.order_index >= payload.total - 1
            ? "Final results coming up…"
            : autoNextLeft > 0
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
      <header className="flex items-center justify-between font-extrabold text-zinc-400">
        <span>Q{game.current_question_index + 1}</span>
        <span
          className={`rounded-full px-4 py-1.5 text-lg font-black tabular-nums text-white ${
            remaining <= 5 ? "bg-red-500" : "bg-brand"
          }`}
        >
          {Math.ceil(remaining)}s
        </span>
      </header>

      <h1 className="rounded-3xl border border-zinc-800 bg-card p-6 text-center text-2xl font-black shadow">
        {q.text}
      </h1>

      {answered ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          {submitError ? (
            <>
              <ClockIcon className="pop-in h-16 w-16" />
              <p className="text-xl font-black text-amber-400">
                Answer didn&apos;t count
              </p>
              <p className="rounded-lg bg-amber-950 px-3 py-2 text-sm font-semibold text-amber-300">
                {submitError}
              </p>
            </>
          ) : (
            <>
              <BoltIcon className="h-14 w-14 animate-pulse" />
              <p className="text-xl font-black">Answer locked in!</p>
              <p className="font-bold text-zinc-400">
                Waiting for everyone else…
              </p>
            </>
          )}
        </div>
      ) : remaining <= 0 ? (
        <p className="flex-1 content-center text-center text-xl font-black text-zinc-400">
          ⏰ Time&apos;s up!
        </p>
      ) : (
        <div className="grid flex-1 content-start gap-3 sm:grid-cols-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => submit(i)}
              className={`min-h-[70px] rounded-2xl p-5 text-lg font-extrabold shadow transition-transform active:scale-95 ${
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
