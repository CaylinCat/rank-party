import { supabase } from "./supabase";
import { findPosition } from "./findPosition";

type Game = {
  id: string;
  current_item_index: number;
};

type Item = {
  id: string;
};

export async function saveRoundPlacement(game: Game, item: Item) {
  const { data: existing } = await supabase
    .from("leaderboard_entries")
    .select("id")
    .eq("item_id", item.id)
    .maybeSingle();

  if (!existing) {
    const { data: votes } = await supabase
      .from("votes")
      .select("*")
      .eq("item_id", item.id);

    const votesList = votes || [];
    const avg =
      votesList.length > 0
        ? votesList.reduce((sum, v) => sum + v.rank, 0) / votesList.length
        : 0;

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
    .eq("id", game.id);

  if (updateError) {
    console.error(updateError);
    return false;
  }

  return true;
}

export async function advanceToNextRound(game: Game) {
  const nextIndex = game.current_item_index + 1;

  if (nextIndex >= 10) {
    const { error } = await supabase
      .from("games")
      .update({
        status: "finished",
        phase: "finished",
      })
      .eq("id", game.id);

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
      })
      .eq("id", game.id);

    if (error) {
      console.error(error);
      return false;
    }
  }

  return true;
}
