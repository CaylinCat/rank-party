"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPlayerId, setPlayerSession } from "@/lib/playerSession";
import { parseItemList, PRESENCE_HEARTBEAT_MS } from "@/lib/constants";
import { DEFAULT_GAME_MODE, type GameMode } from "@/lib/gameModes";
import {
  areSettingsLocked,
  clampGameSettings,
  DEFAULT_GAME_SETTINGS,
  getGameSettings,
  type GameSettings,
} from "@/lib/gameSettings";
import {
  ensureLobbySession,
  fetchActiveSessionByCode,
  fetchLobbySessionByCode,
  setLobbyGameMode,
  setLobbySettings,
  startGame,
} from "@/lib/api/games";
import { fetchPlayers, fetchCurrentPlayer } from "@/lib/api/players";
import { firePartyConfetti } from "@/lib/confetti";
import { usePlayerPresence } from "@/hooks/usePlayerPresence";
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
  const [gameMode, setGameMode] = useState<GameMode>(DEFAULT_GAME_MODE);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [settingsLocked, setSettingsLocked] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  usePlayerPresence();

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      const { data: activeSession } = await fetchActiveSessionByCode(code);
      if (activeSession) {
        if (!cancelled) {
          router.push(`/game/${code}`);
        }
        return;
      }

      let game = (await fetchLobbySessionByCode(code)).data;
      if (!game) {
        const { data: nextSession, error: sessionError } =
          await ensureLobbySession(code);
        if (sessionError || !nextSession) {
          if (!cancelled) {
            setError("Lobby not found.");
            setLoading(false);
          }
          return;
        }
        game = nextSession;
      }

      const gameId = game.id;
      setSessionId(gameId);
      setGameMode(game.game_mode ?? DEFAULT_GAME_MODE);
      setSettings(getGameSettings(game));
      setSettingsLocked(areSettingsLocked(game));

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
            table: "players",
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            const updated = payload.new as Player;
            setPlayers((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "players",
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            const removed = payload.old as { id?: string };
            if (removed.id) {
              setPlayers((prev) => prev.filter((p) => p.id !== removed.id));
            }
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
            const updated = payload.new as {
              status?: string;
              game_mode?: GameMode;
              round_count?: number;
              voting_duration?: number;
              results_duration?: number;
              placement_duration?: number;
              settings_locked?: boolean;
              description?: string | null;
            };
            if (updated.game_mode) {
              setGameMode(updated.game_mode);
            }
            if (updated.settings_locked !== undefined) {
              setSettingsLocked(updated.settings_locked);
            }
            if (
              updated.round_count !== undefined ||
              updated.voting_duration !== undefined ||
              updated.results_duration !== undefined ||
              updated.placement_duration !== undefined ||
              updated.description !== undefined
            ) {
              setSettings((prev) =>
                getGameSettings({
                  round_count: updated.round_count ?? prev.roundCount,
                  voting_duration:
                    updated.voting_duration ?? prev.votingDuration,
                  results_duration:
                    updated.results_duration ?? prev.resultsDuration,
                  placement_duration:
                    updated.placement_duration ?? prev.placementDuration,
                  description:
                    updated.description === null
                      ? ""
                      : (updated.description ?? prev.description),
                })
              );
            }
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

  useEffect(() => {
    if (!sessionId) return;
    const id = sessionId;

    async function refreshPlayers() {
      const { data } = await fetchPlayers(id);
      if (data) setPlayers(data);
    }

    const interval = setInterval(refreshPlayers, PRESENCE_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [sessionId]);

  async function handleSettingsChange(next: GameSettings) {
    if (!isCurrentHost || !sessionId || settingsLocked) return;

    const clamped = clampGameSettings(next);

    setSettings(clamped);
    const { error: settingsError } = await setLobbySettings(sessionId, clamped);
    if (settingsError) {
      console.error(settingsError);
      setError(settingsError.message);
    }
  }

  async function handleGameModeChange(mode: GameMode) {
    if (!isCurrentHost || !sessionId) return;

    setGameMode(mode);
    const { error: modeError } = await setLobbyGameMode(sessionId, mode);
    if (modeError) {
      console.error(modeError);
      setError(modeError.message);
    }
  }

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

    const { data: game, error: gameError } = await fetchLobbySessionByCode(code);

    if (gameError || !game) {
      setError("Lobby not found.");
      setStarting(false);
      return;
    }

    const lobbySettings = getGameSettings(game);
    const { items, error: parseError } = parseItemList(
      itemListInput,
      lobbySettings.roundCount
    );
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
        gameMode={gameMode}
        onGameModeChange={handleGameModeChange}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        settingsLocked={settingsLocked}
        starting={starting}
        error={error}
        onStartGame={handleStartGame}
      />
    </PartyShell>
  );
}
