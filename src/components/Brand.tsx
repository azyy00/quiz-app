/** AQuiz wordmark: interlocked A + Q with lowercase "uiz". */
export default function Brand({
  className = "h-9 w-auto",
}: {
  className?: string;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="AQuiz" className={className} />;
}
