import { supabase } from "./supabase";
import { findPosition } from "./findPosition";
import { calculateResults } from "./calculateResults";
import { calculatePopularResults } from "./calculatePopularResults";
import { isPopularMode } from "./gameModes";
import { getGameSettings } from "./gameSettings";
import type { Game, Item } from "./types";

async function fetchVotesForRound(itemId: string, roundGeneration: number) {
  const { data } = await supabase
    .from("votes")
    .select("*")
    .eq("item_id", itemId)
    .eq("round_generation", roundGeneration);

  return data || [];
}

async function bumpRoundGeneration(game: Game) {
  const { data: currentGame } = await supabase
    .from("games")
    .select("round_generation")
    .eq("id", game.id)
    .maybeSingle();

  const nextGeneration =
    (currentGame?.round_generation ?? game.round_generation ?? 0) + 1;

  const { error } = await supabase
    .from("games")
    .update({
      phase: "voting",
      round_generation: nextGeneration,
    })
    .eq("id", game.id)
    .eq("phase", "results");

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}

async function saveNormalRoundPlacement(game: Game, item: Item) {
  const roundGeneration = game.round_generation ?? 0;

  const { data: existing } = await supabase
    .from("leaderboard_entries")
    .select("id")
    .eq("item_id", item.id)
    .maybeSingle();

  if (!existing) {
    const votes = await fetchVotesForRound(item.id, roundGeneration);
    const { avg } = calculateResults(votes);
    const targetPosition = Math.round(avg);

    const { data: entries } = await supabase
      .from("leaderboard_entries")
      .select("position")
      .eq("game_id", game.id);

    const occupiedPositions = (entries || []).map((e) => e.position);
    const position = findPosition(targetPosition, occupiedPositions);

    const { error: insertError } = await supabase
      .from("leaderboard_entries")
      .insert({
        game_id: game.id,
        item_id: item.id,
        position,
        average_score: avg,
      });

    if (insertError) {
      console.error(insertError);
      return false;
    }
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({ phase: "placement" })
    .eq("id", game.id)
    .eq("phase", "results");

  if (updateError) {
    console.error(updateError);
    return false;
  }

  return true;
}

async function savePopularRoundPlacement(game: Game, item: Item) {
  const roundGeneration = game.round_generation ?? 0;

  const { data: existing } = await supabase
    .from("leaderboard_entries")
    .select("id")
    .eq("item_id", item.id)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("games")
      .update({ phase: "placement" })
      .eq("id", game.id)
      .eq("phase", "results");

    return !updateError;
  }

  const votes = await fetchVotesForRound(item.id, roundGeneration);
  const { mode, isTie } = calculatePopularResults(votes);

  if (isTie || mode === null) {
    return bumpRoundGeneration(game);
  }

  const { data: entries } = await supabase
    .from("leaderboard_entries")
    .select("position")
    .eq("game_id", game.id);

  const occupiedPositions = (entries || []).map((e) => e.position);
  if (occupiedPositions.includes(mode)) {
    return bumpRoundGeneration(game);
  }

  const { error: insertError } = await supabase
    .from("leaderboard_entries")
    .insert({
      game_id: game.id,
      item_id: item.id,
      position: mode,
      average_score: mode,
    });

  if (insertError) {
    console.error(insertError);
    return false;
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({ phase: "placement" })
    .eq("id", game.id)
    .eq("phase", "results");

  if (updateError) {
    console.error(updateError);
    return false;
  }

  return true;
}

export async function saveRoundPlacement(game: Game, item: Item) {
  if (isPopularMode(game)) {
    return savePopularRoundPlacement(game, item);
  }

  return saveNormalRoundPlacement(game, item);
}

export async function advanceToNextRound(game: Game) {
  const nextIndex = game.current_item_index + 1;
  const { roundCount } = getGameSettings(game);

  if (nextIndex >= roundCount) {
    const { error } = await supabase
      .from("games")
      .update({ status: "finished", phase: "finished" })
      .eq("id", game.id)
      .eq("phase", "placement");

    if (error) {
      console.error(error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from("games")
      .update({
        current_item_index: nextIndex,
        phase: "voting",
        round_generation: 0,
      })
      .eq("id", game.id)
      .eq("phase", "placement");

    if (error) {
      console.error(error);
      return false;
    }
  }

  return true;
}
