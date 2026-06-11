import type { Game } from "@/lib/types";

export type GameSettings = {
  roundCount: number;
  votingDuration: number;
  resultsDuration: number;
  placementDuration: number;
};

export const MIN_ROUND_COUNT = 2;
export const MAX_ROUND_COUNT = 10;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  roundCount: 10,
  votingDuration: 30,
  resultsDuration: 5,
  placementDuration: 5,
};

export function getGameSettings(game: Partial<Game> | null): GameSettings {
  return {
    roundCount: game?.round_count ?? DEFAULT_GAME_SETTINGS.roundCount,
    votingDuration:
      game?.voting_duration ?? DEFAULT_GAME_SETTINGS.votingDuration,
    resultsDuration:
      game?.results_duration ?? DEFAULT_GAME_SETTINGS.resultsDuration,
    placementDuration:
      game?.placement_duration ?? DEFAULT_GAME_SETTINGS.placementDuration,
  };
}

export function clampRoundCount(count: number) {
  return Math.min(MAX_ROUND_COUNT, Math.max(MIN_ROUND_COUNT, count));
}

export function clampGameSettings(settings: GameSettings): GameSettings {
  return {
    roundCount: clampRoundCount(settings.roundCount),
    votingDuration: Math.min(120, Math.max(5, settings.votingDuration)),
    resultsDuration: Math.min(60, Math.max(3, settings.resultsDuration)),
    placementDuration: Math.min(60, Math.max(3, settings.placementDuration)),
  };
}

export function areSettingsLocked(game: Partial<Game> | null) {
  return game?.settings_locked === true;
}
