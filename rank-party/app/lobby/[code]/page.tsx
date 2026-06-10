"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPlayerId, setPlayerSession } from "@/lib/playerSession";
import {
  fetchGameByCode,
  isGameStarted,
  startGame,
} from "@/lib/api/games";
import { fetchPlayers, fetchCurrentPlayer } from "@/lib/api/players";
import { useLobbyCode } from "@/hooks/useLobbyCode";
import { PageShell } from "@/components/PageShell";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import type { Player } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export default function LobbyPage() {
  const code = useLobbyCode();
  const router = useRouter();
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

      const { data: game, error: gameError } = await fetchGameByCode(code);

      if (gameError || !game) {
        if (!cancelled) {
          setError("Lobby not found.");
          setLoading(false);
        }
        return;
      }

      if (isGameStarted(game.status)) {
        if (!cancelled) {
          router.push(`/game/${code}`);
        }
        return;
      }

      const gameId = game.id;
      const { data: playerList, error: playersError } =
        await fetchPlayers(gameId);

      if (cancelled) return;

      if (playersError) {
        setError(playersError.message);
        setLoading(false);
        return;
      }

      setPlayers(playerList);

      const playerId = getPlayerId();
      if (playerId) {
        const { data: me } = await fetchCurrentPlayer(gameId, playerId);
        if (me) {
          setPlayerSession(me.id, gameId, me.is_host);
          setIsCurrentHost(me.is_host);
        } else {
          setIsCurrentHost(false);
        }
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
            if (updated.status === "active" || updated.status === "finished") {
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

  async function handleStartGame() {
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

    const { data: game, error: gameError } = await fetchGameByCode(code);

    if (gameError || !game) {
      setError("Lobby not found.");
      setStarting(false);
      return;
    }

    const { error: startError } = await startGame(game.id);

    if (startError) {
      console.error(startError);
      setError(startError.message);
      setStarting(false);
      return;
    }

    router.push(`/game/${code}`);
  }

  if (loading) {
    return (
      <PageShell>
        <LoadingState message="Loading lobby..." />
      </PageShell>
    );
  }

  if (error && players.length === 0) {
    return (
      <PageShell>
        <ErrorState message={error} />
      </PageShell>
    );
  }

  return (
    <PageShell>
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
            onClick={handleStartGame}
            disabled={starting}
          >
            {starting ? "Starting..." : "Start Game"}
          </button>
        ) : (
          <p className="text-sm text-gray-500">Waiting for host to start...</p>
        )}
      </div>
    </PageShell>
  );
}
