import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/games/:gameId/question?playerId=...
// Returns the current question WITHOUT the correct answer while the
// question is live; includes correct_index + the player's own result
// once the game is in "reveal" (or finished).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const playerId = new URL(request.url).searchParams.get("playerId");

  const admin = createAdminClient();
  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (!game || game.current_question_index < 0) {
    return NextResponse.json({ error: "No active question" }, { status: 404 });
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

  const revealed = game.status === "reveal" || game.status === "finished";

  let myAnswer = null;
  if (revealed && playerId) {
    const { data } = await admin
      .from("answers")
      .select("answer_index, is_correct, points_awarded")
      .eq("question_id", question.id)
      .eq("player_id", playerId)
      .maybeSingle();
    myAnswer = data;
  }

  return NextResponse.json({
    question: {
      id: question.id,
      order_index: question.order_index,
      text: question.text,
      options: question.options,
      time_limit: question.time_limit,
      points: question.points,
      ...(revealed ? { correct_index: question.correct_index } : {}),
    },
    started_at: game.question_started_at,
    status: game.status,
    myAnswer,
  });
}
