"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateLobbyCode } from "@/lib/lobbyCode";
import { setPlayerSession } from "@/lib/playerSession";
import { createGame } from "@/lib/api/games";
import { createHostPlayer } from "@/lib/api/players";
import { PageShell } from "@/components/PageShell";

export default function Home() {
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
    router.push(`/lobby/${code}`);
  }

  return (
    <PageShell>
      <div className="text-center space-y-4 w-72">
        <h1 className="text-4xl font-bold">Rank Party</h1>

        <input
          className="w-full p-2 border rounded"
          placeholder="Your name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          disabled={loading}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={createLobby}
          disabled={loading}
          className="w-full px-6 py-3 bg-black text-white rounded-xl hover:opacity-80 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Lobby"}
        </button>

        <Link href="/join" className="block text-sm text-gray-600 hover:underline">
          Join a lobby
        </Link>
      </div>
    </PageShell>
  );
}
