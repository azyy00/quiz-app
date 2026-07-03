import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizEditor from "@/components/QuizEditor";
import type { Question, Quiz } from "@/lib/types";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();
  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("order_index");

  return (
    <QuizEditor
      quiz={quiz as Quiz}
      initialQuestions={(questions ?? []) as Question[]}
    />
  );
}
