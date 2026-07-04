import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// Quiz generation can take a while for 20 questions
export const maxDuration = 60;

const QUESTION_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correct_index: { type: "integer" },
          time_limit: { type: "integer" },
          points: { type: "integer" },
        },
        required: ["text", "options", "correct_index", "time_limit", "points"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
} as const;

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

// POST /api/quiz/generate — AI-generate quiz questions for a topic.
// body: { topic, count?, difficulty? } — creators only.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI generation is not configured (missing ANTHROPIC_API_KEY)" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const topic = String(body.topic ?? "").trim().slice(0, 200);
  const count = clamp(parseInt(body.count, 10) || 10, 1, 20);
  const difficulty = ["easy", "medium", "hard"].includes(body.difficulty)
    ? body.difficulty
    : "medium";

  if (!topic) {
    return NextResponse.json({ error: "Give me a topic" }, { status: 400 });
  }

  const anthropic = new Anthropic();

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        format: { type: "json_schema", schema: QUESTION_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Create ${count} ${difficulty}-difficulty multiple-choice quiz questions about: ${topic}

Rules:
- This is for a live Kahoot-style party quiz, so keep questions punchy and fun to read aloud
- Each question has exactly 4 answer options, except true/false questions which have exactly 2 ("True", "False")
- correct_index is the 0-based index of the correct option
- Shuffle where the correct answer sits; don't always put it first
- Facts must be accurate; avoid ambiguous or opinion-based questions
- Vary the angle across questions so they don't feel repetitive
- time_limit is seconds: 10 for quick recall, 15-20 if the question needs reading time; use 10 for most
- points: 1000 for standard questions, 500 for true/false
- Write everything in the same language as the topic prompt`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "Could not generate questions for this topic" },
        { status: 422 }
      );
    }

    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) {
      return NextResponse.json(
        { error: "The generator returned no questions, try again" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(text) as {
      questions: {
        text: string;
        options: string[];
        correct_index: number;
        time_limit: number;
        points: number;
      }[];
    };

    // Belt-and-suspenders validation against the game's constraints
    const questions = parsed.questions
      .filter(
        (q) =>
          q.text?.trim() &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          q.options.length <= 4 &&
          q.correct_index >= 0 &&
          q.correct_index < q.options.length
      )
      .slice(0, count)
      .map((q) => ({
        text: q.text.trim().slice(0, 500),
        options: q.options.map((o) => String(o).slice(0, 200)),
        correct_index: q.correct_index,
        time_limit: clamp(q.time_limit || 10, 5, 120),
        points: clamp(q.points || 1000, 0, 2000),
      }));

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "The generator returned no usable questions, try again" },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("Quiz generation failed:", err);
    const message =
      err instanceof Anthropic.APIError
        ? `Generation failed (${err.status})`
        : "Generation failed, please try again";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
