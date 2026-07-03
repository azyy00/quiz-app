"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Game, Player } from "@/lib/types";

/**
 * Subscribes to realtime updates for a game: the game row itself
 * (status / question changes) and the player list (joins + scores).
 * Falls back to a light poll so a missed websocket event can't
 * strand a client in a stale state.
 */
export function useGame(gameId: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const [{ data: g }, { data: ps }] = await Promise.all([
        supabase.from("games").select("*").eq("id", gameId).single(),
        supabase
          .from("players")
          .select("*")
          .eq("game_id", gameId)
          .order("score", { ascending: false })
          .order("joined_at"),
      ]);
      if (cancelled) return;
      if (g) setGame(g as Game);
      if (ps) setPlayers(ps as Player[]);
    }

    load();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => setGame(payload.new as Game)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Re-fetch to keep ordering consistent
          supabase
            .from("players")
            .select("*")
            .eq("game_id", gameId)
            .order("score", { ascending: false })
            .order("joined_at")
            .then(({ data }) => {
              if (!cancelled && data) setPlayers(data as Player[]);
            });
        }
      )
      .subscribe();

    const poll = setInterval(load, 5000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return { game, players };
}

/** Countdown driven by the server timestamp, so all clients agree. */
export function useCountdown(startedAt: string | null, timeLimit: number) {
  const [remaining, setRemaining] = useState(timeLimit);

  useEffect(() => {
    if (!startedAt) return;
    const startMs = new Date(startedAt).getTime();
    const tick = () => {
      const elapsed = (Date.now() - startMs) / 1000;
      setRemaining(Math.max(0, timeLimit - elapsed));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [startedAt, timeLimit]);

  return remaining;
}
