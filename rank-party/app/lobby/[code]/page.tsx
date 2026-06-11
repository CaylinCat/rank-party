"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPlayerId, setPlayerSession } from "@/lib/playerSession";
import { parseItemList } from "@/lib/constants";
import {
  fetchGameByCode,
  isGameStarted,
  prepareRematch,
  startGame,
} from "@/lib/api/games";
import { fetchPlayers, fetchCurrentPlayer } from "@/lib/api/players";
import { firePartyConfetti } from "@/lib/confetti";
import { useLobbyCode } from "@/hooks/useLobbyCode";
import { PartyShell } from "@/components/shell/PartyShell";
import { PartyCard } from "@/components/shell/PartyCard";
import { LobbyRoom } from "@/components/lobby/LobbyRoom";
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
  const [itemListInput, setItemListInput] = useState("");

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

      if (game.status === "finished") {
        await prepareRematch(gameId);
      }
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
            if (updated.status === "active") {
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

    const { items, error: parseError } = parseItemList(itemListInput);
    if (!items) {
      setError(parseError ?? "Invalid item list.");
      setStarting(false);
      return;
    }

    const { error: startError } = await startGame(game.id, items);

    if (startError) {
      console.error(startError);
      setError(startError.message);
      setStarting(false);
      return;
    }

    firePartyConfetti();
    router.push(`/game/${code}`);
  }

  if (loading) {
    return (
      <PartyShell fullHeight>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingState message="Loading lobby..." />
        </div>
      </PartyShell>
    );
  }

  if (error && players.length === 0) {
    return (
      <PartyShell>
        <PartyCard className="max-w-md mx-auto">
          <ErrorState message={error} />
        </PartyCard>
      </PartyShell>
    );
  }

  return (
    <PartyShell fullHeight>
      <LobbyRoom
        code={code}
        players={players}
        isCurrentHost={isCurrentHost}
        itemListInput={itemListInput}
        onItemListChange={setItemListInput}
        starting={starting}
        error={error}
        onStartGame={handleStartGame}
      />
    </PartyShell>
  );
}
