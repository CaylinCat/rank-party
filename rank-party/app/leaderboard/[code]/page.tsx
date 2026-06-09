"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LeaderboardEntry = {
  id: string;
  item_id: string;
  position: number;
  average_score: number;
  items: { text: string } | null;
};

export default function LeaderboardPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id")
        .eq("lobby_code", code)
        .single();

      if (gameError || !game) {
        setError("Game not found.");
        setLoading(false);
        return;
      }

      const { data, error: entriesError } = await supabase
        .from("leaderboard_entries")
        .select("id, item_id, position, average_score, items(text)")
        .eq("game_id", game.id)
        .order("position", { ascending: true });

      if (entriesError) {
        setError(entriesError.message);
        setLoading(false);
        return;
      }

      setEntries((data as unknown as LeaderboardEntry[]) || []);
      setLoading(false);
    }

    load();
  }, [code]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="space-y-4 w-96">
        <h1 className="text-3xl font-bold text-center">Leaderboard</h1>

        <ol className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="text-lg">
              {entry.position}. {entry.items?.text ?? "Unknown"} (
              {entry.average_score.toFixed(1)})
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
