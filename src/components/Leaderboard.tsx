"use client";

import type { Player } from "@/lib/types";

const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard({
  players,
  highlightId,
  limit,
}: {
  players: Player[];
  highlightId?: string;
  limit?: number;
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const shown = limit ? ranked.slice(0, limit) : ranked;

  return (
    <ol className="flex w-full flex-col gap-2">
      {shown.map((p, i) => (
        <li
          key={p.id}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
            p.id === highlightId
              ? "bg-brand text-white"
              : "bg-white text-slate-900"
          } shadow`}
        >
          <span className="w-8 text-center text-lg font-black">
            {medals[i] ?? i + 1}
          </span>
          <span className="flex-1 truncate font-extrabold">
            {p.nickname}
            {p.is_guest && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                  p.id === highlightId
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                Guest
              </span>
            )}
          </span>
          <span className="font-black tabular-nums">{p.score}</span>
        </li>
      ))}
      {shown.length === 0 && (
        <li className="rounded-2xl bg-white px-4 py-6 text-center font-bold text-slate-400 shadow">
          No players yet
        </li>
      )}
    </ol>
  );
}
