"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Player = {
  id: string;
  name: string;
  is_host: boolean;
};

export default function LobbyPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function init() {
      const { data: game } = await supabase
        .from("games")
        .select("*")
        .eq("lobby_code", code)
        .single();

      if (!game || cancelled) return;

      const gameId = game.id;

      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId);

      if (cancelled) return;

      setPlayers(playersData || []);

      channel = supabase
        .channel("players-room")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "players",
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            setPlayers((prev) => [...prev, payload.new as Player]);
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
  }, [code]);

  async function startGame() {
    const { data: game } = await supabase
      .from("games")
      .select("*")
      .eq("lobby_code", code)
      .single();

    if (!game) return;

    const items = [
      "Bob is cool",
      "Cats rule",
      "Pizza is amazing",
      "Mondays suck",
      "React is fun",
      "Dogs are better",
      "Coffee > Tea",
      "Summer > Winter",
      "AI will take over",
      "This game is chaotic",
    ];

    await supabase.from("items").insert(
      items.map((text, i) => ({
        game_id: game.id,
        text,
        round_index: i,
      }))
    );

    await supabase
      .from("games")
      .update({
        phase: "showing",
        current_item_index: 0,
      })
      .eq("id", game.id);
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Lobby</h1>
        <p className="text-gray-600">Code: {code}</p>

        <ul className="space-y-1">
          {players.map((player) => (
            <li key={player.id}>
              {player.name}
              {player.is_host && " (host)"}
            </li>
          ))}
        </ul>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={startGame}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
