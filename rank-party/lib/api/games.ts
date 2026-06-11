import { supabase } from "@/lib/supabase";
import type { GameMode } from "@/lib/gameModes";
import type { GameSettings } from "@/lib/gameSettings";
import type { Game, GamePhase, GameStatus } from "@/lib/types";

function normalizeLobbyCode(code: string) {
  return code.toUpperCase();
}

export function isGameJoinable(status: string) {
  return status === "lobby";
}

export function isGameStarted(status: string) {
  return status === "active";
}

export async function fetchSessionByCode(
  code: string,
  statuses: GameStatus[]
) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("lobby_code", normalizeLobbyCode(code))
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data: data as Game | null, error };
}

export async function fetchLobbySessionByCode(code: string) {
  return fetchSessionByCode(code, ["lobby"]);
}

export async function fetchActiveSessionByCode(code: string) {
  return fetchSessionByCode(code, ["active"]);
}

export async function fetchLatestFinishedSessionByCode(code: string) {
  return fetchSessionByCode(code, ["finished"]);
}

export async function fetchSessionById(gameId: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .maybeSingle();

  return { data: data as Game | null, error };
}

/** @deprecated Use fetchLobbySessionByCode or fetchActiveSessionByCode */
export async function fetchGameByCode(code: string) {
  const lobby = await fetchLobbySessionByCode(code);
  if (lobby.data) return lobby;

  const active = await fetchActiveSessionByCode(code);
  if (active.data) return active;

  return fetchLatestFinishedSessionByCode(code);
}

export async function createGame(lobbyCode: string) {
  const { data, error } = await supabase
    .from("games")
    .insert({ lobby_code: normalizeLobbyCode(lobbyCode), status: "lobby" })
    .select()
    .single();

  return { data: data as Game | null, error };
}

export async function createNextSession(
  lobbyCode: string,
  previousGameId: string
) {
  const { data: newGame, error: createError } = await supabase
    .from("games")
    .insert({
      lobby_code: normalizeLobbyCode(lobbyCode),
      status: "lobby",
    })
    .select()
    .single();

  if (createError || !newGame) {
    return { data: null, error: createError };
  }

  const { error: migrateError } = await supabase
    .from("players")
    .update({ game_id: newGame.id })
    .eq("game_id", previousGameId);

  return { data: newGame as Game, error: migrateError };
}

/** Opens a new lobby session after a finished game, reusing the same lobby code. */
export async function ensureLobbySession(lobbyCode: string) {
  const existing = await fetchLobbySessionByCode(lobbyCode);
  if (existing.data) return existing;

  const { data: finished, error: finishedError } =
    await fetchLatestFinishedSessionByCode(lobbyCode);

  if (finishedError) return { data: null, error: finishedError };
  if (!finished) {
    return { data: null, error: new Error("Lobby not found.") };
  }

  return createNextSession(lobbyCode, finished.id);
}

export async function setLobbySettings(
  gameId: string,
  settings: Partial<GameSettings>
) {
  const patch: Record<string, number | string | null> = {};

  if (settings.roundCount !== undefined) {
    patch.round_count = settings.roundCount;
  }
  if (settings.votingDuration !== undefined) {
    patch.voting_duration = settings.votingDuration;
  }
  if (settings.resultsDuration !== undefined) {
    patch.results_duration = settings.resultsDuration;
  }
  if (settings.placementDuration !== undefined) {
    patch.placement_duration = settings.placementDuration;
  }
  if (settings.description !== undefined) {
    const trimmed = settings.description.trim();
    patch.description = trimmed || null;
  }

  const { error } = await supabase
    .from("games")
    .update(patch)
    .eq("id", gameId)
    .eq("status", "lobby")
    .eq("settings_locked", false);

  return { error };
}

export async function setLobbyGameMode(gameId: string, mode: GameMode) {
  const { error } = await supabase
    .from("games")
    .update({ game_mode: mode })
    .eq("id", gameId)
    .eq("status", "lobby");

  return { error };
}

export async function fetchUsedRanks(gameId: string) {
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("position")
    .eq("game_id", gameId);

  if (error) return { data: [] as number[], error };

  return { data: (data || []).map((entry) => entry.position), error: null };
}

export async function fetchItems(gameId: string) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("game_id", gameId)
    .order("round_index");

  return { data, error };
}

export async function startGame(gameId: string, items: string[]) {
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
      settings_locked: true,
    })
    .eq("id", gameId)
    .eq("status", "lobby");

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
