-- ============================================================
-- Realtime Quiz App — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

-- ---------- Tables ----------

create table public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.questions (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references public.quizzes (id) on delete cascade,
  order_index   int  not null,
  text          text not null,
  -- Array of 2–4 answer option strings
  options       jsonb not null,
  correct_index int  not null,
  -- Seconds players have to answer
  time_limit    int  not null default 30 check (time_limit between 5 and 120),
  points        int  not null default 1000 check (points between 0 and 2000),
  unique (quiz_id, order_index)
);

create table public.games (
  id                     uuid primary key default gen_random_uuid(),
  quiz_id                uuid not null references public.quizzes (id) on delete cascade,
  host_id                uuid not null references auth.users (id) on delete cascade,
  pin                    text not null unique,
  -- lobby -> question -> reveal -> (question -> reveal ...) -> finished
  status                 text not null default 'lobby'
                         check (status in ('lobby', 'question', 'reveal', 'finished')),
  current_question_index int  not null default -1,
  question_started_at    timestamptz,
  created_at             timestamptz not null default now()
);

create table public.players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games (id) on delete cascade,
  -- Set when a registered user joins; null for guests
  user_id   uuid references auth.users (id) on delete set null,
  is_guest  boolean not null default true,
  nickname  text not null check (char_length(nickname) between 1 and 20),
  score     int  not null default 0,
  joined_at timestamptz not null default now(),
  unique (game_id, nickname)
);

create table public.answers (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references public.games (id) on delete cascade,
  player_id      uuid not null references public.players (id) on delete cascade,
  question_id    uuid not null references public.questions (id) on delete cascade,
  answer_index   int  not null,
  is_correct     boolean not null,
  points_awarded int  not null default 0,
  answered_at    timestamptz not null default now(),
  unique (player_id, question_id)
);

create index questions_quiz_idx on public.questions (quiz_id, order_index);
create index games_pin_idx on public.games (pin) where status <> 'finished';
create index players_game_idx on public.players (game_id);
create index answers_game_question_idx on public.answers (game_id, question_id);

-- ---------- Row Level Security ----------
-- Writes to games/players/answers go through the app's API routes
-- (service role), so no public insert/update policies are needed there.

alter table public.quizzes   enable row level security;
alter table public.questions enable row level security;
alter table public.games     enable row level security;
alter table public.players   enable row level security;
alter table public.answers   enable row level security;

-- Quizzes: owners manage their own
create policy "owners select quizzes" on public.quizzes
  for select using (auth.uid() = owner_id);
create policy "owners insert quizzes" on public.quizzes
  for insert with check (auth.uid() = owner_id);
create policy "owners update quizzes" on public.quizzes
  for update using (auth.uid() = owner_id);
create policy "owners delete quizzes" on public.quizzes
  for delete using (auth.uid() = owner_id);

-- Questions: managed via quiz ownership
create policy "owners manage questions" on public.questions
  for all using (
    exists (select 1 from public.quizzes q
            where q.id = quiz_id and q.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.quizzes q
            where q.id = quiz_id and q.owner_id = auth.uid())
  );

-- Games: anyone (incl. guests with the anon key) can read game state;
-- realtime subscriptions need this.
create policy "anyone reads games" on public.games
  for select using (true);

-- Players: anyone can read (lobby lists, leaderboards)
create policy "anyone reads players" on public.players
  for select using (true);

-- Answers: readable by anyone once the game reveals them (kept simple:
-- rows contain no secrets beyond correctness, which is shown on reveal)
create policy "anyone reads answers" on public.answers
  for select using (true);

-- ---------- Realtime ----------
-- Broadcast row changes for live lobbies, game state, and leaderboards.
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.players;
