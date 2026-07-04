import Link from "next/link";
import Brand from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Brand />
      <p className="text-7xl font-black text-zinc-700">404</p>
      <h1 className="text-2xl font-extrabold">
        This page doesn&apos;t exist
      </h1>
      <p className="max-w-sm text-zinc-400">
        The link may be wrong, or the game you&apos;re looking for has ended.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-brand px-6 py-3 font-extrabold text-white hover:bg-brand-dark"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border-2 border-zinc-700 px-6 py-3 font-extrabold hover:bg-zinc-800"
        >
          My quizzes
        </Link>
      </div>
    </main>
  );
}
