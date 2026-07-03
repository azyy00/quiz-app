import PlayerScreen from "@/components/PlayerScreen";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  return <PlayerScreen gameId={gameId} />;
}
