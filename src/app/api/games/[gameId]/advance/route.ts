import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/games/:gameId/advance — host-only game state machine.
// body: { action: "start" | "reveal" | "next" | "finish" }
//   start  : lobby  -> question (index 0)
//   reveal : question -> reveal (locks answers, shows correct answer)
//   next   : reveal -> question (index+1), or finished after the last one
//   finish : any    -> finished
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { action } = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.host_id !== user.id) {
    return NextResponse.json({ error: "Not your game" }, { status: 403 });
  }

  const { count: questionCount } = await admin
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", game.quiz_id);
  const total = questionCount ?? 0;

  let update: Record<string, unknown> | null = null;

  switch (action) {
    case "start":
      if (game.status !== "lobby") break;
      update = {
        status: "question",
        current_question_index: 0,
        question_started_at: new Date().toISOString(),
      };
      break;
    case "reveal":
      if (game.status !== "question") break;
      update = { status: "reveal" };
      break;
    case "next": {
      if (game.status !== "reveal") break;
      const nextIndex = game.current_question_index + 1;
      update =
        nextIndex >= total
          ? { status: "finished" }
          : {
              status: "question",
              current_question_index: nextIndex,
              question_started_at: new Date().toISOString(),
            };
      break;
    }
    case "finish":
      update = { status: "finished" };
      break;
  }

  if (!update) {
    return NextResponse.json(
      { error: `Invalid action "${action}" for status "${game.status}"` },
      { status: 409 }
    );
  }

  const { data: updated, error } = await admin
    .from("games")
    .update(update)
    .eq("id", gameId)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ game: updated });
}
