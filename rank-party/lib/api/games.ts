import { supabase } from "@/lib/supabase";
import type { Game, GamePhase } from "@/lib/types";

export function isGameJoinable(status: string) {
  return status !== "active" && status !== "finished";
}

export function isGameStarted(status: string) {
  return status === "active";
}

export async function fetchGameByCode(code: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("lobby_code", code.toUpperCase())
    .single();

  return { data: data as Game | null, error };
}

export async function createGame(lobbyCode: string) {
  const { data, error } = await supabase
    .from("games")
    .insert({ lobby_code: lobbyCode, status: "lobby" })
    .select()
    .single();

  return { data: data as Game | null, error };
}

export async function fetchItems(gameId: string) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("game_id", gameId)
    .order("round_index");

  return { data, error };
}

async function clearGameRoundData(gameId: string) {
  const [votes, entries, items] = await Promise.all([
    supabase.from("votes").delete().eq("game_id", gameId),
    supabase.from("leaderboard_entries").delete().eq("game_id", gameId),
    supabase.from("items").delete().eq("game_id", gameId),
  ]);

  const error = votes.error ?? entries.error ?? items.error;
  return { error };
}

export async function prepareRematch(gameId: string) {
  // Best-effort; host startGame will fully clear if this fails (e.g. RLS)
  await clearGameRoundData(gameId);

  const { error } = await supabase
    .from("games")
    .update({ status: "lobby", current_item_index: 0 })
    .eq("id", gameId)
    .eq("status", "finished");

  return { error };
}

export async function startGame(gameId: string, items: string[]) {
  const { error: clearError } = await clearGameRoundData(gameId);
  if (clearError) return { error: clearError };

  const { error: itemsError } = await supabase.from("items").insert(
    items.map((text, i) => ({
      game_id: gameId,
      text,
      round_index: i,
    }))
  );

  if (itemsError) return { error: itemsError };

  const { error } = await supabase
    .from("games")
    .update({
      phase: "voting",
      status: "active",
      current_item_index: 0,
    })
    .eq("id", gameId);

  return { error };
}

export async function setGamePhase(
  gameId: string,
  phase: GamePhase,
  fromPhase?: GamePhase
) {
  let query = supabase.from("games").update({ phase }).eq("id", gameId);
  if (fromPhase) {
    query = query.eq("phase", fromPhase);
  }
  const { error } = await query;
  return { error };
}
