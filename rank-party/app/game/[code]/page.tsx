"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GamePage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [game, setGame] = useState<any>(null);
  const [item, setItem] = useState<any>(null);
  const [vote, setVote] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: g } = await supabase
        .from("games")
        .select("*")
        .eq("lobby_code", code)
        .single();

      if (!g || cancelled) return;

      setGame(g);

      const { data: items } = await supabase
        .from("items")
        .select("*")
        .eq("game_id", g.id)
        .order("round_index");

      if (cancelled) return;

      setItem(items?.[g.current_item_index ?? 0]);
    }

    load();

    const channel = supabase
      .channel("game-room")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [code]);

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

  if (!item) return <div>Loading...</div>;

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
    </div>
  );
}
