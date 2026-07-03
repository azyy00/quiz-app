"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartGameButton({
  quizId,
  disabled,
}: {
  quizId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function hostGame() {
    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start game");
      router.push(`/host/${data.game.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not start game");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={hostGame}
      disabled={disabled || loading}
      title={disabled ? "Add at least one question first" : undefined}
      className="rounded-full bg-neon px-4 py-2 text-sm font-extrabold text-black hover:bg-neon-pink hover:text-white disabled:opacity-40"
    >
      {loading ? "Starting…" : "Host live"}
    </button>
  );
}
