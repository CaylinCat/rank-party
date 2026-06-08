"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculateResults } from "@/lib/calculateResults";
import type { RealtimeChannel } from "@supabase/supabase-js";

export default function GamePage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [game, setGame] = useState<any>(null);
  const [item, setItem] = useState<any>(null);
  const [vote, setVote] = useState<number | null>(null);
  const [avg, setAvg] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({});

  const loadResults = useCallback(async (itemId: string) => {
    const { data: votes } = await supabase
      .from("votes")
      .select("*")
      .eq("item_id", itemId);

    const results = calculateResults(votes || []);
    setAvg(results.avg);
    setDistribution(results.distribution);
  }, []);

  const load = useCallback(async () => {
    const { data: g, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("lobby_code", code)
      .single();

    if (gameError) {
      console.error(gameError);
      return null;
    }

    if (!g) return null;

    setGame(g);

    const { data: items } = await supabase
      .from("items")
      .select("*")
      .eq("game_id", g.id)
      .order("round_index");

    const currentItem = items?.[g.current_item_index ?? 0] ?? null;
    setItem(currentItem);

    if (g.phase === "results" && currentItem) {
      await loadResults(currentItem.id);
    }

    return g;
  }, [code, loadResults]);

  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function init() {
      const g = await load();
      if (!g || cancelled) return;

      channel = supabase
        .channel(`game-${code}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${g.id}`,
          },
          () => {
            load();
          }
        )
        .subscribe();
    }

    init();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [code, load]);

  async function submitVote(rank: number) {
    if (!game || !item) return;

    const playerId = localStorage.getItem("playerId");
    if (!playerId) {
      alert("Join the lobby first so we know who you are.");
      return;
    }

    setVote(rank);

    const { error } = await supabase.from("votes").insert({
      game_id: game.id,
      item_id: item.id,
      player_id: playerId,
      rank,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      setVote(null);
    }
  }

  async function showResults() {
    if (!game || !item) return;

    const { error } = await supabase
      .from("games")
      .update({ phase: "results" })
      .eq("id", game.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setGame({ ...game, phase: "results" });
    await loadResults(item.id);
  }

  if (!game || !item) return <div>Loading...</div>;

  if (game.phase === "results") {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{item.text}</h1>

          <p>Average: {avg.toFixed(2)} / 10</p>

          <div className="space-y-1">
            {Object.entries(distribution).map(([rank, count]) => (
              <div key={rank} className="flex gap-2 items-center">
                <span className="w-4">{rank}:</span>
                <div className="bg-black h-4" style={{ width: count * 10 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6">
      <h1 className="text-3xl font-bold">{item.text}</h1>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <button
            key={i}
            onClick={() => submitVote(i + 1)}
            className={`p-3 border rounded ${
              vote === i + 1 ? "bg-black text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        onClick={showResults}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Show Results
      </button>
    </div>
  );
}
