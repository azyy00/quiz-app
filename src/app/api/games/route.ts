import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/games — host creates a live game session from a quiz
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { quizId } = await request.json().catch(() => ({}));
  if (!quizId) {
    return NextResponse.json({ error: "quizId is required" }, { status: 400 });
  }

  // RLS guarantees the user owns this quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, questions(count)")
    .eq("id", quizId)
    .single();
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }
  if (!quiz.questions?.[0]?.count) {
    return NextResponse.json(
      { error: "Add at least one question before hosting" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  // Retry on the (unlikely) chance of a PIN collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: game, error } = await admin
      .from("games")
      .insert({ quiz_id: quizId, host_id: user.id, pin: generatePin() })
      .select()
      .single();
    if (!error) return NextResponse.json({ game });
    if (!error.message.includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not create game" }, { status: 500 });
}
