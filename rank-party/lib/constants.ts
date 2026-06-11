export const ROUND_COUNT = 10;
export const VOTING_DURATION = 30;
export const RESULTS_DURATION = 5;
export const PLACEMENT_DURATION = 5;

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

export function parseItemList(input: string): {
  items: string[] | null;
  error?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { items: [...DEFAULT_ITEMS] };
  }

  const items = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (items.length !== ROUND_COUNT) {
    return {
      items: null,
      error: `Enter exactly ${ROUND_COUNT} items, separated by commas.`,
    };
  }

  return { items };
}
