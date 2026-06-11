"use client";

import { Card, CardContent } from "@/components/ui/card";
import { HostItemsInput } from "@/components/lobby/HostItemsInput";
import { LobbyActionBar } from "@/components/lobby/LobbyActionBar";
import { LobbyCodeDisplay } from "@/components/lobby/LobbyCodeDisplay";
import { PlayerList } from "@/components/lobby/PlayerList";
import type { Player } from "@/lib/types";

type LobbyRoomProps = {
  code: string;
  players: Player[];
  isCurrentHost: boolean;
  itemListInput: string;
  onItemListChange: (value: string) => void;
  starting: boolean;
  error: string | null;
  onStartGame: () => void;
};

export function LobbyRoom({
  code,
  players,
  isCurrentHost,
  itemListInput,
  onItemListChange,
  starting,
  error,
  onStartGame,
}: LobbyRoomProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col">
      <div className="mb-8 text-center text-white">
        <h1 className="font-display text-4xl font-extrabold">Lobby</h1>
        <p className="mt-1 text-lg font-semibold text-white/90">
          Get ready to rank!
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <PlayerList players={players} />

        <div className="space-y-4">
          <Card className="rounded-3xl border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
            <CardContent className="p-0">
              <LobbyCodeDisplay code={code} />
            </CardContent>
          </Card>

          {isCurrentHost && (
            <HostItemsInput
              value={itemListInput}
              onChange={onItemListChange}
              disabled={starting}
            />
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-center text-sm font-bold text-white drop-shadow">
          {error}
        </p>
      )}

      <LobbyActionBar
        isHost={isCurrentHost}
        starting={starting}
        onStartGame={onStartGame}
      />
    </div>
  );
}
