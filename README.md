# QuizBlitz — Realtime Quiz Game

A Kahoot-style live quiz app. Creators build quizzes and host live games;
players join with a link or 6-digit code — as guests (nickname only) or with
an account — and answer timed questions while the leaderboard updates in
real time.

## Tech stack

| Layer     | Choice                                             |
| --------- | -------------------------------------------------- |
| Frontend  | Next.js 15 (App Router) + React 19 + TypeScript    |
| Styling   | Tailwind CSS v4                                    |
| Backend   | Next.js API routes + Supabase                      |
| Database  | Supabase Postgres                                  |
| Realtime  | Supabase Realtime (postgres_changes)               |
| Auth      | Supabase Auth — email/password, Google OAuth, guest mode |

## How it works

- **Creator flow**: sign up → dashboard → create quiz (multiple-choice
  questions, per-question timer, default 30s) → "Host live" → share the
  join link or code → start the quiz → control question pacing → final
  leaderboard.
- **Player flow**: open `/join/<code>` → log in, register, or continue as
  guest (nickname only, marked "Guest" everywhere) → lobby → answer each
  timed question → see correct/wrong + points after each question → live
  ranking → final results.
- **Scoring** (server-side, anti-cheat): correct answers earn
  `round(points × remainingTime / totalTime)` (default base 1000); wrong or
  missing answers earn 0. Time is measured on the server from the moment
  the question opened, and the correct answer is never sent to players
  until the reveal.
- **Sync**: game state lives in one `games` row; all clients subscribe to
  its changes via Supabase Realtime (plus a 5s poll fallback). The host
  advances a state machine: `lobby → question → reveal → … → finished`.
  Answers are locked server-side when the timer expires, and a unique
  constraint prevents double answers.

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a project.
2. In the **SQL Editor**, run the contents of
   [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql).
3. (Optional, for Google login) In **Authentication → Providers → Google**,
   enable Google and add your OAuth client ID/secret. Add
   `http://localhost:3000/auth/callback` (and your production URL) to the
   redirect allowlist.
4. For quick local testing you can disable email confirmation under
   **Authentication → Providers → Email**.

### 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — never exposed to the browser)
- `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` for dev)

### 3. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign up, create a quiz, hit **Host live**, and
join from a second browser/incognito window with the game code.

## Deployment

Vercel is the natural fit (zero-config for Next.js):

1. Push this repo to GitHub and import it in Vercel.
2. Add the four environment variables from `.env.local`.
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL and add
   `https://<your-domain>/auth/callback` to Supabase's auth redirect list.

Supabase Realtime works out of the box — no long-running server needed.

## Project structure

```
supabase/migrations/001_init.sql    Schema, RLS policies, realtime publication
src/
├── middleware.ts                   Session refresh + creator route guard
├── lib/
│   ├── types.ts                    Shared TypeScript models
│   ├── useGame.ts                  Realtime game/players hook + countdown
│   └── supabase/                   Browser / server / admin (service-role) clients
├── components/
│   ├── AuthForm.tsx                Login & signup (email + Google)
│   ├── QuizEditor.tsx              Create/edit quiz with questions
│   ├── JoinForm.tsx                Login / register / guest join
│   ├── HostScreen.tsx              Lobby → live control → results
│   ├── PlayerScreen.tsx            Lobby → answer → reveal → results
│   ├── Leaderboard.tsx             Ranked list with Guest badges
│   └── StartGameButton.tsx
└── app/
    ├── page.tsx                    Landing (join by code)
    ├── login/ · signup/ · auth/    Auth pages + OAuth callback + signout
    ├── dashboard/                  Creator's quizzes
    ├── quiz/new · quiz/[id]/edit   Quiz editor pages
    ├── host/[gameId]/              Host screen
    ├── join/[pin]/                 Shareable join link
    ├── play/[gameId]/              Player screen
    └── api/games/                  create · join · advance · answer · question
```

## Security notes

- All game mutations go through API routes using the service-role key;
  browser clients have read-only access (RLS) to game state.
- Scores are computed server-side from server timestamps.
- The correct answer index is stripped from question payloads until reveal.
- Duplicate answers are blocked by a database unique constraint.

## Credits

- Player avatars: [DiceBear](https://www.dicebear.com) "bottts" style by
  Pablo Stanley — free for personal and commercial use, generated locally.
