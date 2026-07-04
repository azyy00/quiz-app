import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AQuiz | Realtime Quiz Game",
  description:
    "Create quizzes, share a link, and play live with friends. Guests join with just a nickname.",
  openGraph: {
    title: "AQuiz | Realtime Quiz Game",
    description:
      "Create quizzes, share a link, and play live with friends. Guests join with just a nickname.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
