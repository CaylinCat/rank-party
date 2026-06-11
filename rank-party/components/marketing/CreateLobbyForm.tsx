"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateLobbyCode } from "@/lib/lobbyCode";
import { setPlayerSession } from "@/lib/playerSession";
import { createGame } from "@/lib/api/games";
import { createHostPlayer } from "@/lib/api/players";
import { firePartyConfetti } from "@/lib/confetti";

export function CreateLobbyForm() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createLobby() {
    if (!hostName.trim()) {
      setError("Enter your name to create a lobby.");
      return;
    }

    setLoading(true);
    setError(null);

    const code = generateLobbyCode();
    const { data: game, error: gameError } = await createGame(code);

    if (gameError || !game) {
      console.error(gameError);
      setError(gameError?.message ?? "Failed to create lobby.");
      setLoading(false);
      return;
    }

    const { data: player, error: playerError } = await createHostPlayer(
      game.id,
      hostName.trim()
    );

    if (playerError || !player) {
      console.error(playerError);
      setError(playerError?.message ?? "Failed to register host.");
      setLoading(false);
      return;
    }

    setPlayerSession(player.id, game.id, true);
    firePartyConfetti();
    router.push(`/lobby/${code}`);
  }

  return (
    <Card className="mx-auto w-full max-w-sm rounded-3xl border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <label htmlFor="host-name" className="text-sm font-medium">
            Your name
          </label>
          <Input
            id="host-name"
            placeholder="Enter your name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            disabled={loading}
            className="h-11 rounded-xl"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={createLobby}
          disabled={loading}
          size="lg"
          className="h-12 w-full rounded-xl text-base"
        >
          {loading ? "Creating..." : "Create Lobby"}
        </Button>

        <Link href="/join" className="block">
          <Button variant="ghost" className="w-full rounded-xl">
            Join a lobby
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
