import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StartGameButton from "@/components/StartGameButton";
import type { Quiz } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*, questions(count)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-brand">
          QuizBlitz
        </Link>
        <form action="/auth/signout" method="post">
          <button className="text-sm font-bold text-slate-500 hover:text-slate-700">
            Sign out
          </button>
        </form>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black">My quizzes</h1>
        <Link
          href="/quiz/new"
          className="rounded-full bg-brand px-5 py-2 font-bold text-white hover:bg-brand-dark"
        >
          + New quiz
        </Link>
      </div>

      {!quizzes?.length && (
        <div className="rounded-3xl bg-white p-10 text-center shadow">
          <p className="mb-4 text-lg font-bold text-slate-500">
            No quizzes yet. Create your first one!
          </p>
          <Link
            href="/quiz/new"
            className="inline-block rounded-full bg-brand px-6 py-3 font-extrabold text-white hover:bg-brand-dark"
          >
            Create a quiz
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {(quizzes as (Quiz & { questions: { count: number }[] })[] | null)?.map(
          (quiz) => (
            <li
              key={quiz.id}
              className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-xl font-extrabold">{quiz.title}</h2>
                <p className="text-sm font-semibold text-slate-500">
                  {quiz.questions?.[0]?.count ?? 0} question
                  {(quiz.questions?.[0]?.count ?? 0) === 1 ? "" : "s"}
                  {quiz.description ? ` · ${quiz.description}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/quiz/${quiz.id}/edit`}
                  className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50"
                >
                  Edit
                </Link>
                <StartGameButton
                  quizId={quiz.id}
                  disabled={(quiz.questions?.[0]?.count ?? 0) === 0}
                />
              </div>
            </li>
          )
        )}
      </ul>
    </main>
  );
}
