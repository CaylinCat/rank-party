"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  async function joinGame() {
    const { data: game, error } = await supabase
      .from("games")
      .select("*")
      .eq("lobby_code", code.toUpperCase())
      .single();

    if (error || !game) {
      alert("Lobby not found");
      return;
    }

    const { data: player, error: insertError } = await supabase
      .from("players")
      .insert({
        game_id: game.id,
        name,
        is_host: false,
      })
      .select()
      .single();

    if (insertError || !player) {
      console.error(insertError);
      alert(insertError?.message ?? "Failed to join lobby");
      return;
    }

    localStorage.setItem("playerId", player.id);

    router.push(`/lobby/${code.toUpperCase()}`);
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="space-y-3 w-72">
        <h1 className="text-2xl font-bold">Join Lobby</h1>

        <input
          className="w-full p-2 border rounded"
          placeholder="Code (e.g. ABCD)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={joinGame}
          className="w-full bg-black text-white p-2 rounded"
        >
          Join
        </button>
      </div>
    </div>
  );
}
