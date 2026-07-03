/** AzyQuiz wordmark: red "Azy", brand-purple "Quiz", with the logo tile. */
export default function Brand({ withLogo = true }: { withLogo?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-2xl font-black">
      {withLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo.svg" alt="AzyQuiz logo" className="h-8 w-8" />
      )}
      <span>
        <span className="text-red-500">Azy</span>
        <span className="text-brand">Quiz</span>
      </span>
    </span>
  );
}
