"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaitingPulse } from "@/components/lobby/WaitingPulse";

type LobbyActionBarProps = {
  isHost: boolean;
  starting: boolean;
  onStartGame: () => void;
};

export function LobbyActionBar({
  isHost,
  starting,
  onStartGame,
}: LobbyActionBarProps) {
  return (
    <div className="mt-auto flex w-full justify-center pb-4 pt-8">
      {isHost ? (
        <Button
          onClick={onStartGame}
          disabled={starting}
          size="lg"
          className="h-14 min-w-64 rounded-2xl bg-emerald-500 px-10 text-lg font-semibold text-white shadow-xl hover:bg-emerald-600"
        >
          <Sparkles className="size-5" />
          {starting ? "Starting..." : "Start Game"}
        </Button>
      ) : (
        <WaitingPulse />
      )}
    </div>
  );
}
