import { supabase } from "@/lib/supabase";
import { DEFAULT_ITEMS } from "@/lib/constants";
import type { Game, GamePhase } from "@/lib/types";

export function isGameJoinable(status: string) {
  return status !== "active" && status !== "finished";
}

export function isGameStarted(status: string) {
  return status === "active" || status === "finished";
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

export async function startGame(gameId: string) {
  const { error: itemsError } = await supabase.from("items").insert(
    DEFAULT_ITEMS.map((text, i) => ({
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
