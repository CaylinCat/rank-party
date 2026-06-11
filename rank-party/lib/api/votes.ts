import { supabase } from "@/lib/supabase";
import type { VoteProgress } from "@/lib/types";

export async function submitVote(
  gameId: string,
  itemId: string,
  playerId: string,
  rank: number
) {
  const { error } = await supabase.from("votes").insert({
    game_id: gameId,
    item_id: itemId,
    player_id: playerId,
    rank,
  });

  return { error };
}

export async function fetchVoteProgress(
  gameId: string,
  itemId: string
): Promise<VoteProgress> {
  const cutoff = new Date(Date.now() - 30_000).toISOString();

  const [{ count }, { data: votes }] = await Promise.all([
    supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId)
      .gt("last_seen", cutoff),
    supabase.from("votes").select("player_id").eq("item_id", itemId),
  ]);

  return {
    totalPlayers: count ?? 0,
    totalVotes: votes?.length ?? 0,
  };
}

export async function fetchExistingVote(itemId: string, playerId: string) {
  const { data, error } = await supabase
    .from("votes")
    .select("rank")
    .eq("item_id", itemId)
    .eq("player_id", playerId)
    .maybeSingle();

  return { data, error };
}

export async function fetchVotesForItem(itemId: string) {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("item_id", itemId);

  return { data: data || [], error };
}
