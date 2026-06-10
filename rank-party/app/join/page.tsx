"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setPlayerSession } from "@/lib/playerSession";
import { fetchGameByCode, isGameJoinable } from "@/lib/api/games";
import { joinPlayer } from "@/lib/api/players";
import { PageShell } from "@/components/PageShell";

export default function JoinPage() {
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
    <PageShell>
      <div className="space-y-3 w-72">
        <h1 className="text-2xl font-bold">Join Lobby</h1>

        <input
          className="w-full p-2 border rounded"
          placeholder="Code (e.g. ABCD)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={loading}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={joinGame}
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join"}
        </button>

        <Link href="/" className="block text-sm text-gray-600 hover:underline">
          Back home
        </Link>
      </div>
    </PageShell>
  );
}
