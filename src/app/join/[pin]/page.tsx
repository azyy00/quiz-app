import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import JoinForm from "@/components/JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ pin: string }>;
}) {
  const { pin } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Suspense>
      <JoinForm
        pin={pin}
        isLoggedIn={!!user}
        defaultNickname={user?.email?.split("@")[0] ?? ""}
      />
    </Suspense>
  );
}
