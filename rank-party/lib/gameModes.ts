export type GameMode = "normal" | "popular";

export type GameModeOption = {
  id: GameMode;
  label: string;
  description: string;
  details: string[];
  available: boolean;
};

export const GAME_MODES: GameModeOption[] = [
  {
    id: "normal",
    label: "Normal",
    description: "Classic ranking — average score decides each tier slot.",
    details: [
      "Everyone ranks each item 1–10",
      "Average score picks the slot",
      "10 rounds, one final tier list",
    ],
    available: true,
  },
  {
    id: "popular",
    label: "Popular",
    description: "Mode (most common rank) wins — ties go back in the pile.",
    details: [
      "Winning rank is the mode, not the average",
      "Ties send the item back to be voted again",
      "Once slot 4 is taken, nobody can pick 4 again",
    ],
    available: true,
  },
];

export const DEFAULT_GAME_MODE: GameMode = "normal";

export function getGameModeOption(mode: GameMode) {
  return GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0];
}

export function isPopularMode(game: { game_mode?: GameMode } | null) {
  return game?.game_mode === "popular";
}
