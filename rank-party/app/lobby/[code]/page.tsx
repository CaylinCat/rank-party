"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPlayerId, setPlayerSession } from "@/lib/playerSession";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Player = {
  id: string;
  name: string;
  is_host: boolean;
};

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCurrentHost, setIsCurrentHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("lobby_code", code)
        .single();

      if (gameError || !game) {
        if (!cancelled) {
          setError("Lobby not found.");
          setLoading(false);
        }
        return;
      }

      if (game.status === "active" || game.status === "finished") {
        if (!cancelled) {
          router.push(`/game/${code}`);
        }
        return;
      }

      const gameId = game.id;

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId);

      if (cancelled) return;

      if (playersError) {
        setError(playersError.message);
        setLoading(false);
        return;
      }

      const playerList = playersData || [];
      setPlayers(playerList);

      const playerId = getPlayerId();
      const me = playerList.find((p) => p.id === playerId);
      if (me) {
        setPlayerSession(me.id, gameId, me.is_host);
        setIsCurrentHost(me.is_host);
      } else {
        setIsCurrentHost(false);
      }

      setLoading(false);

      channel = supabase
        .channel(`players-room-${gameId}`)
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
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            const updated = payload.new as { status?: string };
            if (
              updated.status === "active" ||
              updated.status === "finished"
            ) {
              router.push(`/game/${code}`);
            }
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
  }, [code, router]);

  async function startGame() {
    if (!isCurrentHost) {
      setError("Only the host can start the game.");
      return;
    }

    const playerId = getPlayerId();
    if (!playerId) {
      setError("Session expired. Create or join a lobby again.");
      return;
    }

    setStarting(true);
    setError(null);

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("lobby_code", code)
      .single();

    if (gameError || !game) {
      setError("Lobby not found.");
      setStarting(false);
      return;
    }

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

    const { error: itemsError } = await supabase.from("items").insert(
      items.map((text, i) => ({
        game_id: game.id,
        text,
        round_index: i,
      }))
    );

    if (itemsError) {
      console.error(itemsError);
      setError(itemsError.message);
      setStarting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("games")
      .update({
        phase: "voting",
        status: "active",
        current_item_index: 0,
      })
      .eq("id", game.id);

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      setStarting(false);
      return;
    }

    router.push(`/game/${code}`);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p>Loading lobby...</p>
      </div>
    );
  }

  if (error && players.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isCurrentHost ? (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            onClick={startGame}
            disabled={starting}
          >
            {starting ? "Starting..." : "Start Game"}
          </button>
        ) : (
          <p className="text-sm text-gray-500">Waiting for host to start...</p>
        )}
      </div>
    </div>
  );
}
