"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateLobbyCode } from "@/lib/lobbyCode";
import { setPlayerSession } from "@/lib/playerSession";

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

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        lobby_code: code,
        status: "lobby",
      })
      .select()
      .single();

    if (gameError || !game) {
      console.error(gameError);
      setError(gameError?.message ?? "Failed to create lobby.");
      setLoading(false);
      return;
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        game_id: game.id,
        name: hostName.trim(),
        is_host: true,
      })
      .select()
      .single();

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
    <div className="h-screen flex items-center justify-center bg-gray-50">
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
    </div>
  );
}
