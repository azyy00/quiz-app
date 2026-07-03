"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseQuestionCsv } from "@/lib/importQuestions";
import type { Question, Quiz } from "@/lib/types";

interface EditableQuestion {
  id?: string;
  text: string;
  options: string[];
  correct_index: number;
  time_limit: number;
  points: number;
}

const emptyQuestion = (): EditableQuestion => ({
  text: "",
  options: ["", "", "", ""],
  correct_index: 0,
  time_limit: 10,
  points: 1000,
});

export default function QuizEditor({
  quiz,
  initialQuestions,
}: {
  quiz?: Quiz;
  initialQuestions?: Question[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    initialQuestions?.length
      ? initialQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          options: [...q.options],
          correct_index: q.correct_index,
          time_limit: q.time_limit,
          points: q.points,
        }))
      : [emptyQuestion()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function importCsv(file: File) {
    setError(null);
    setImportNotice(null);
    const text = await file.text();
    const { questions: imported, errors } = parseQuestionCsv(text);

    if (imported.length > 0) {
      const padded = imported.map((q) => ({
        ...q,
        // Editor UI always shows 4 option slots
        options: [...q.options, "", "", ""].slice(0, 4),
      }));
      setQuestions((qs) => {
        // Replace the single untouched starter question instead of appending to it
        const isPristine =
          qs.length === 1 &&
          !qs[0].text.trim() &&
          qs[0].options.every((o) => !o.trim());
        return isPristine ? padded : [...qs, ...padded];
      });
    }

    const parts = [
      imported.length > 0
        ? `Imported ${imported.length} question${imported.length === 1 ? "" : "s"}.`
        : null,
      ...errors,
    ].filter(Boolean);
    if (errors.length > 0) setError(parts.join(" "));
    else setImportNotice(parts.join(" "));
  }

  function updateQuestion(i: number, patch: Partial<EditableQuestion>) {
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }

  function updateOption(i: number, oi: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, j) =>
        j === i
          ? { ...q, options: q.options.map((o, k) => (k === oi ? value : o)) }
          : q
      )
    );
  }

  async function save() {
    setError(null);
    if (!title.trim()) return setError("Give your quiz a title.");
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) return setError(`Question ${i + 1} needs text.`);
      const filled = q.options.filter((o) => o.trim());
      if (filled.length < 2)
        return setError(`Question ${i + 1} needs at least 2 answer options.`);
      if (!q.options[q.correct_index]?.trim())
        return setError(
          `Question ${i + 1}: the correct answer can't be an empty option.`
        );
    }

    setSaving(true);
    const supabase = createClient();
    try {
      let quizId = quiz?.id;
      if (quizId) {
        const { error } = await supabase
          .from("quizzes")
          .update({ title, description, updated_at: new Date().toISOString() })
          .eq("id", quizId);
        if (error) throw error;
        // Simplest reliable sync: replace all questions.
        const { error: delErr } = await supabase
          .from("questions")
          .delete()
          .eq("quiz_id", quizId);
        if (delErr) throw delErr;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { data, error } = await supabase
          .from("quizzes")
          .insert({ title, description, owner_id: user.id })
          .select()
          .single();
        if (error) throw error;
        quizId = data.id;
      }

      const rows = questions.map((q, i) => ({
        quiz_id: quizId,
        order_index: i,
        text: q.text.trim(),
        // Drop empty trailing options, keep at least the filled ones
        options: q.options.filter((o) => o.trim()),
        correct_index: q.options
          .filter((o) => o.trim())
          .indexOf(q.options[q.correct_index]),
        time_limit: q.time_limit,
        points: q.points,
      }));
      const { error: qErr } = await supabase.from("questions").insert(rows);
      if (qErr) throw qErr;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save quiz");
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-brand">
          ← Back
        </Link>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-brand px-6 py-2 font-extrabold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save quiz"}
        </button>
      </header>

      {error && (
        <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 font-bold text-red-400">
          {error}
        </p>
      )}
      {importNotice && (
        <p className="mb-4 rounded-xl bg-emerald-950 px-4 py-3 font-bold text-emerald-300">
          {importNotice}
        </p>
      )}

      <div className="mb-6 rounded-3xl bg-card p-6 shadow">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quiz title"
          className="mb-3 w-full rounded-xl border-2 border-zinc-700 px-4 py-3 text-xl font-extrabold outline-none focus:border-brand"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full rounded-xl border-2 border-zinc-700 px-4 py-3 font-semibold outline-none focus:border-brand"
        />
      </div>

      {questions.map((q, i) => (
        <div key={i} className="mb-4 rounded-3xl bg-card p-6 shadow">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-black text-zinc-500">Question {i + 1}</span>
            <button
              onClick={() =>
                setQuestions((qs) => qs.filter((_, j) => j !== i))
              }
              disabled={questions.length === 1}
              className="text-sm font-bold text-red-400 hover:text-red-400 disabled:opacity-30"
            >
              Remove
            </button>
          </div>

          <input
            value={q.text}
            onChange={(e) => updateQuestion(i, { text: e.target.value })}
            placeholder="Ask your question…"
            className="mb-4 w-full rounded-xl border-2 border-zinc-700 px-4 py-3 font-bold outline-none focus:border-brand"
          />

          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 ${
                  q.correct_index === oi
                    ? "border-neon bg-emerald-950"
                    : "border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name={`correct-${i}`}
                  checked={q.correct_index === oi}
                  onChange={() => updateQuestion(i, { correct_index: oi })}
                  title="Mark as correct answer"
                  className="accent-[#00FF85]"
                />
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, oi, e.target.value)}
                  placeholder={`Option ${oi + 1}${oi > 1 ? " (optional)" : ""}`}
                  className="w-full bg-transparent font-semibold outline-none"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-zinc-400">
            <label className="flex items-center gap-2">
              Timer
              <select
                value={q.time_limit}
                onChange={(e) =>
                  updateQuestion(i, { time_limit: Number(e.target.value) })
                }
                className="rounded-lg border-2 border-zinc-700 px-2 py-1"
              >
                {[10, 15, 20, 30, 45, 60, 90, 120].map((s) => (
                  <option key={s} value={s}>
                    {s}s
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Points
              <select
                value={q.points}
                onChange={(e) =>
                  updateQuestion(i, { points: Number(e.target.value) })
                }
                className="rounded-lg border-2 border-zinc-700 px-2 py-1"
              >
                {[500, 1000, 2000].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-zinc-500">
              Tick the radio next to the correct answer
            </span>
          </div>
        </div>
      ))}

      <button
        onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
        className="w-full rounded-3xl border-4 border-dashed border-zinc-700 py-4 font-extrabold text-brand hover:bg-zinc-800"
      >
        + Add question
      </button>

      <div className="mt-4 rounded-3xl bg-card p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold">Import questions</h2>
            <p className="text-sm font-semibold text-zinc-400">
              Upload a CSV file — imported questions are added below your
              existing ones.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/question-template.csv"
              download
              className="rounded-full border-2 border-zinc-700 px-4 py-2 text-sm font-bold hover:bg-zinc-800"
            >
              ⬇ Download template
            </a>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-brand px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-dark"
            >
              ⬆ Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCsv(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold text-zinc-500">
          Format: question, option1–option4 (option3/4 optional), correct
          (1–4), time_limit (seconds), points. Works with files exported from
          Excel or Google Sheets as CSV.
        </p>
      </div>
    </main>
  );
}
