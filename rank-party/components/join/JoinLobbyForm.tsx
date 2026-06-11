"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LobbyCodeTiles } from "@/components/join/LobbyCodeTiles";
import { setPlayerSession } from "@/lib/playerSession";
import { fetchGameByCode, isGameJoinable } from "@/lib/api/games";
import { joinPlayer } from "@/lib/api/players";

export function JoinLobbyForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinGame() {
    if (!code.trim() || !name.trim()) {
      setError("Enter a lobby code and your name.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: game, error: gameError } = await fetchGameByCode(code);

    if (gameError || !game) {
      setError("Lobby not found.");
      setLoading(false);
      return;
    }

    if (!isGameJoinable(game.status)) {
      setError("This game has already started.");
      setLoading(false);
      return;
    }

    const { data: player, error: insertError } = await joinPlayer(
      game.id,
      name.trim()
    );

    if (insertError || !player) {
      console.error(insertError);
      setError(insertError?.message ?? "Failed to join lobby.");
      setLoading(false);
      return;
    }

    setPlayerSession(player.id, game.id, false);
    router.push(`/lobby/${code.toUpperCase()}`);
  }

  return (
    <Card className="mx-auto w-full max-w-sm rounded-3xl border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardContent className="space-y-4 pt-6">
        <h1 className="text-center font-display text-3xl font-bold">Join Lobby</h1>

        <LobbyCodeTiles value={code} onChange={setCode} disabled={loading} />

        <div className="space-y-2">
          <label htmlFor="join-name" className="text-sm font-medium">
            Your name
          </label>
          <Input
            id="join-name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="h-11 rounded-xl"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={joinGame}
          disabled={loading}
          size="lg"
          className="h-12 w-full rounded-xl text-base"
        >
          {loading ? "Joining..." : "Join"}
        </Button>

        <Link href="/" className="block">
          <Button variant="ghost" className="w-full rounded-xl">
            <ArrowLeft className="size-4" />
            Back home
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
