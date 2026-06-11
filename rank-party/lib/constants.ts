import { DEFAULT_GAME_SETTINGS } from "@/lib/gameSettings";

/** Default fallbacks only — gameplay timers read from `game` via getGameSettings(). */
export const ROUND_COUNT = DEFAULT_GAME_SETTINGS.roundCount;

export const PRESENCE_HEARTBEAT_MS = 10_000;
export const PRESENCE_ACTIVE_MS = 30_000;
export const PRESENCE_STALE_MS = 60_000;

export const DEFAULT_ITEMS = [
  "Bob is cool",
  "Cats rule",
  "Pizza is amazing",
  "Mondays suck",
  "React is fun",
  "Dogs are better",
  "Coffee > Tea",
  "Summer > Winter",
  "AI will take over",
  "This game is chaotic",
];

export function parseItemList(
  input: string,
  roundCount: number = ROUND_COUNT
): {
  items: string[] | null;
  error?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { items: DEFAULT_ITEMS.slice(0, roundCount) };
  }

  const items = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (items.length !== roundCount) {
    return {
      items: null,
      error: `Enter exactly ${roundCount} items, separated by commas.`,
    };
  }

  return { items };
}
