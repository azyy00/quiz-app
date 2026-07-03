import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HostScreen from "@/components/HostScreen";
import type { Question } from "@/lib/types";

export default async function HostPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (!game) notFound();

  // The host owns the quiz, so RLS lets them read full questions
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", game.quiz_id)
    .order("order_index");

  return (
    <HostScreen gameId={gameId} questions={(questions ?? []) as Question[]} />
  );
}
