import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/types";

export async function createHostPlayer(gameId: string, name: string) {
  const { data, error } = await supabase
    .from("players")
    .insert({ game_id: gameId, name, is_host: true })
    .select()
    .single();

  return { data: data as Player | null, error };
}

export async function joinPlayer(gameId: string, name: string) {
  const { data, error } = await supabase
    .from("players")
    .insert({ game_id: gameId, name, is_host: false })
    .select()
    .single();

  return { data: data as Player | null, error };
}

export async function fetchPlayers(gameId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId);

  return { data: (data as Player[]) || [], error };
}

export async function fetchCurrentPlayer(gameId: string, playerId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("id, is_host")
    .eq("id", playerId)
    .eq("game_id", gameId)
    .maybeSingle();

  return { data: data as Pick<Player, "id" | "is_host"> | null, error };
}
