import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/games/:gameId/answer — submit an answer, scored server-side.
// body: { playerId, answerIndex }
//
// Scoring: score = round(points * remainingTime / totalTime) for a correct
// answer; 0 for wrong or missing answers. Time is measured on the server
// from games.question_started_at, so clients can't fake speed.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const { playerId, answerIndex } = await request.json().catch(() => ({}));

  if (!playerId || typeof answerIndex !== "number") {
    return NextResponse.json(
      { error: "playerId and answerIndex are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (!game || game.status !== "question" || !game.question_started_at) {
    return NextResponse.json(
      { error: "Answers are locked right now" },
      { status: 409 }
    );
  }

  const { data: player } = await admin
    .from("players")
    .select("id, game_id")
    .eq("id", playerId)
    .eq("game_id", gameId)
    .single();
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const { data: question } = await admin
    .from("questions")
    .select("*")
    .eq("quiz_id", game.quiz_id)
    .eq("order_index", game.current_question_index)
    .single();
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const elapsedSec =
    (Date.now() - new Date(game.question_started_at).getTime()) / 1000;
  // 2s grace for network latency
  if (elapsedSec > question.time_limit + 2) {
    return NextResponse.json({ error: "Time is up!" }, { status: 409 });
  }

  const options = question.options as string[];
  if (answerIndex < 0 || answerIndex >= options.length) {
    return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
  }

  const isCorrect = answerIndex === question.correct_index;
  const remaining = Math.max(0, question.time_limit - elapsedSec);
  const pointsAwarded = isCorrect
    ? Math.round((question.points * remaining) / question.time_limit)
    : 0;

  // Unique (player_id, question_id) constraint blocks duplicate answers
  const { error: insertErr } = await admin.from("answers").insert({
    game_id: gameId,
    player_id: playerId,
    question_id: question.id,
    answer_index: answerIndex,
    is_correct: isCorrect,
    points_awarded: pointsAwarded,
  });
  if (insertErr) {
    const message = insertErr.message.includes("duplicate")
      ? "You already answered this question"
      : insertErr.message;
    return NextResponse.json({ error: message }, { status: 409 });
  }

  if (pointsAwarded > 0) {
    // Read-then-write is fine here: one row per player, one answer per question
    const { data: p } = await admin
      .from("players")
      .select("score")
      .eq("id", playerId)
      .single();
    await admin
      .from("players")
      .update({ score: (p?.score ?? 0) + pointsAwarded })
      .eq("id", playerId);
  }

  // Return the outcome so the client can render the reveal reliably
  // without re-querying (the client hides it until the reveal).
  return NextResponse.json({
    ok: true,
    result: {
      answer_index: answerIndex,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    },
  });
}
