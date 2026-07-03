export type GameStatus = "lobby" | "question" | "reveal" | "finished";

export interface Quiz {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  order_index: number;
  text: string;
  options: string[];
  correct_index: number;
  time_limit: number;
  points: number;
}

export interface Game {
  id: string;
  quiz_id: string;
  host_id: string;
  pin: string;
  status: GameStatus;
  current_question_index: number;
  question_started_at: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  user_id: string | null;
  is_guest: boolean;
  nickname: string;
  score: number;
  joined_at: string;
}

export interface Answer {
  id: string;
  game_id: string;
  player_id: string;
  question_id: string;
  answer_index: number;
  is_correct: boolean;
  points_awarded: number;
  answered_at: string;
}

/** Question data safe to send to players (no correct_index). */
export interface PublicQuestion {
  id: string;
  order_index: number;
  text: string;
  options: string[];
  time_limit: number;
  points: number;
}
