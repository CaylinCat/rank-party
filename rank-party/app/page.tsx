"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateLobbyCode } from "@/lib/lobbyCode";

export default function Home() {
  const router = useRouter();

  async function createLobby() {
    const code = generateLobbyCode();

    const { data, error } = await supabase
      .from("games")
      .insert({
        lobby_code: code,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    router.push(`/lobby/${code}`);
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Rank Party</h1>

        <button
          onClick={createLobby}
          className="px-6 py-3 bg-black text-white rounded-xl hover:opacity-80"
        >
          Create Lobby
        </button>
      </div>
    </div>
  );
}
