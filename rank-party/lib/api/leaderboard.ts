import { supabase } from "@/lib/supabase";
import { DEFAULT_GAME_SETTINGS } from "@/lib/gameSettings";
import type { LeaderboardEntry } from "@/lib/types";

export async function fetchLeaderboard(gameId: string) {
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("id, item_id, position, average_score, items(text)")
    .eq("game_id", gameId)
    .order("position", { ascending: true });

  return { data: (data as unknown as LeaderboardEntry[]) || [], error };
}

export function formatTierListText(
  entries: LeaderboardEntry[],
  roundCount: number = DEFAULT_GAME_SETTINGS.roundCount
) {
  return Array.from({ length: roundCount }, (_, i) => {
    const position = i + 1;
    const entry = entries.find((e) => e.position === position);
    if (!entry) return `${position}. —`;
    const text = entry.items?.text ?? "Unknown";
    return `${position}. ${text}`;
  }).join("\n");
}
