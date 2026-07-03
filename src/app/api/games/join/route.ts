import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/games/join — join a lobby by PIN with a nickname.
// Works for guests (no session) and registered users alike.
export async function POST(request: Request) {
  const { pin, nickname } = await request.json().catch(() => ({}));
  const cleanPin = String(pin ?? "").trim();
  const cleanNick = String(nickname ?? "").trim().slice(0, 20);

  if (!cleanPin || !cleanNick) {
    return NextResponse.json(
      { error: "Game code and nickname are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: game } = await admin
    .from("games")
    .select("id, status")
    .eq("pin", cleanPin)
    .neq("status", "finished")
    .maybeSingle();

  if (!game) {
    return NextResponse.json(
      { error: "Game not found. Check the code and try again." },
      { status: 404 }
    );
  }
  if (game.status !== "lobby") {
    return NextResponse.json(
      { error: "This game has already started." },
      { status: 409 }
    );
  }

  const { data: player, error } = await admin
    .from("players")
    .insert({
      game_id: game.id,
      nickname: cleanNick,
      user_id: user?.id ?? null,
      is_guest: !user,
    })
    .select()
    .single();

  if (error) {
    const message = error.message.includes("duplicate")
      ? "That nickname is taken in this game — pick another."
      : error.message;
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({ gameId: game.id, player });
}
