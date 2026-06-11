export type GameStatus = "lobby" | "active" | "finished";
export type GamePhase = "voting" | "results" | "placement" | "finished" | "showing";

/** One play-through session; multiple sessions share the same lobby_code. */
export type Game = {
  id: string;
  lobby_code: string;
  status: GameStatus;
  phase: GamePhase;
  current_item_index: number;
  created_at?: string;
};

export type Item = {
  id: string;
  game_id: string;
  text: string;
  round_index: number;
};

export type Player = {
  id: string;
  game_id: string;
  name: string;
  is_host: boolean;
  last_seen?: string;
};

export type Vote = {
  id: string;
  game_id: string;
  item_id: string;
  player_id: string;
  rank: number;
};

export type LeaderboardEntry = {
  id: string;
  item_id: string;
  position: number;
  average_score: number;
  items: { text: string } | null;
};

export type VoteProgress = {
  totalPlayers: number;
  totalVotes: number;
};
