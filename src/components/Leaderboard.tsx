"use client";

import { useEffect, useRef, useState } from "react";
import { MedalIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";
import type { Player } from "@/lib/types";

const ROW_H = 56;
const GAP = 8;

/**
 * Live-animated leaderboard: rows are absolutely positioned by rank and
 * slide to their new spot whenever scores change, so players visibly
 * rise and fall in real time. Rows flash green when their score jumps.
 */
export default function Leaderboard({
  players,
  highlightId,
  limit,
}: {
  players: Player[];
  highlightId?: string;
  limit?: number;
}) {
  const ranked = [...players].sort(
    (a, b) => b.score - a.score || a.joined_at.localeCompare(b.joined_at)
  );
  const shown = limit ? ranked.slice(0, limit) : ranked;

  // Flash rows whose score just increased
  const prevScores = useRef<Map<string, number>>(new Map());
  const [bumped, setBumped] = useState<Set<string>>(new Set());
  useEffect(() => {
    const ups = new Set<string>();
    for (const p of players) {
      const prev = prevScores.current.get(p.id);
      if (prev !== undefined && p.score > prev) ups.add(p.id);
      prevScores.current.set(p.id, p.score);
    }
    if (ups.size > 0) {
      setBumped(ups);
      const t = setTimeout(() => setBumped(new Set()), 900);
      return () => clearTimeout(t);
    }
  }, [players]);

  if (shown.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-4 py-6 text-center font-bold text-slate-400 shadow">
        No players yet
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      style={{ height: shown.length * (ROW_H + GAP) - GAP }}
    >
      {shown.map((p, i) => {
        const isMe = p.id === highlightId;
        const justScored = bumped.has(p.id);
        return (
          <div
            key={p.id}
            className={`absolute left-0 flex w-full items-center gap-3 rounded-2xl px-4 shadow ${
              isMe ? "bg-brand text-white" : "bg-white text-slate-900"
            } ${justScored ? "ring-4 ring-emerald-300" : ""}`}
            style={{
              height: ROW_H,
              transform: `translateY(${i * (ROW_H + GAP)}px)`,
              transition:
                "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 300ms",
              zIndex: justScored ? 2 : 1,
            }}
          >
            <span className="flex w-8 items-center justify-center text-lg font-black">
              {i < 3 ? (
                <MedalIcon rank={(i + 1) as 1 | 2 | 3} className="h-7 w-7" />
              ) : (
                i + 1
              )}
            </span>
            <Avatar seed={p.nickname} className="h-9 w-9" />
            <span className="flex-1 truncate font-extrabold">
              {p.nickname}
              {p.is_guest && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                    isMe ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Guest
                </span>
              )}
            </span>
            {justScored && (
              <span className="animate-pulse text-sm font-black text-emerald-500">
                ▲
              </span>
            )}
            <span className="font-black tabular-nums">{p.score}</span>
          </div>
        );
      })}
    </div>
  );
}
