"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculateResults } from "@/lib/calculateResults";
import { processRound } from "@/lib/processRound";
import { getPlayerId, setPlayerSession } from "@/lib/playerSession";
import type { RealtimeChannel } from "@supabase/supabase-js";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [game, setGame] = useState<any>(null);
  const [item, setItem] = useState<any>(null);
  const [vote, setVote] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [avg, setAvg] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCurrentHost, setIsCurrentHost] = useState(false);

  const loadExistingVote = useCallback(
    async (itemId: string, playerId: string) => {
      const { data } = await supabase
        .from("votes")
        .select("rank")
        .eq("item_id", itemId)
        .eq("player_id", playerId)
        .maybeSingle();

      if (data) {
        setVote(data.rank);
        setHasVoted(true);
      } else {
        setVote(null);
        setHasVoted(false);
      }
    },
    []
  );

  const loadResults = useCallback(async (itemId: string) => {
    const { data: votes } = await supabase
      .from("votes")
      .select("*")
      .eq("item_id", itemId);

    const results = calculateResults(votes || []);
    setAvg(results.avg);
    setDistribution(results.distribution);
  }, []);

  const load = useCallback(async () => {
    setError(null);

    const { data: g, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("lobby_code", code)
      .single();

    if (gameError) {
      console.error(gameError);
      setError(gameError.message);
      setLoading(false);
      return null;
    }

    if (!g) {
      setError("Game not found.");
      setLoading(false);
      return null;
    }

    setGame(g);

    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("*")
      .eq("game_id", g.id)
      .order("round_index");

    if (itemsError) {
      console.error(itemsError);
      setError(itemsError.message);
      setLoading(false);
      return null;
    }

    const currentItem = items?.[g.current_item_index ?? 0] ?? null;
    setItem(currentItem);

    const playerId = getPlayerId();
    if (playerId) {
      const { data: me } = await supabase
        .from("players")
        .select("id, is_host")
        .eq("id", playerId)
        .eq("game_id", g.id)
        .maybeSingle();

      if (me) {
        setPlayerSession(me.id, g.id, me.is_host);
        setIsCurrentHost(me.is_host);
      } else {
        setIsCurrentHost(false);
      }
    } else {
      setIsCurrentHost(false);
    }

    if (currentItem && playerId) {
      await loadExistingVote(currentItem.id, playerId);
    } else {
      setVote(null);
      setHasVoted(false);
    }

    if (g.phase === "results" && currentItem) {
      await loadResults(currentItem.id);
    }

    setLoading(false);
    return g;
  }, [code, loadExistingVote, loadResults]);

  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function init() {
      const g = await load();
      if (!g || cancelled) return;

      channel = supabase
        .channel(`game-${code}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${g.id}`,
          },
          () => {
            load();
          }
        )
        .subscribe();
    }

    init();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [code, load]);

  useEffect(() => {
    if (game?.phase === "finished") {
      router.push(`/leaderboard/${code}`);
    }
  }, [game?.phase, code, router]);

  useEffect(() => {
    if (game?.phase !== "results" || !game || !item) return;

    const currentGame = game;
    const currentItem = item;

    const timer = setTimeout(async () => {
      await processRound(currentGame, currentItem);
      await load();
    }, 5000);

    return () => clearTimeout(timer);
  }, [game?.phase, game?.id, game?.current_item_index, item?.id, load]);

  async function submitVote(rank: number) {
    if (!game || !item || hasVoted || submitting) return;

    const playerId = getPlayerId();
    if (!playerId) {
      setError("Join the lobby first so we know who you are.");
      return;
    }

    const { data: existing } = await supabase
      .from("votes")
      .select("id")
      .eq("item_id", item.id)
      .eq("player_id", playerId)
      .maybeSingle();

    if (existing) {
      setHasVoted(true);
      setError("You already voted on this item.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setVote(rank);

    const { error: voteError } = await supabase.from("votes").insert({
      game_id: game.id,
      item_id: item.id,
      player_id: playerId,
      rank,
    });

    if (voteError) {
      console.error(voteError);
      setError(voteError.message);
      setVote(null);
      setSubmitting(false);
      return;
    }

    setHasVoted(true);
    setSubmitting(false);
  }

  async function showResults() {
    if (!game || !item) return;

    if (!isCurrentHost) {
      setError("Only the host can show results.");
      return;
    }

    const { error: updateError } = await supabase
      .from("games")
      .update({ phase: "results" })
      .eq("id", game.id);

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      return;
    }

    setGame({ ...game, phase: "results" });
    await loadResults(item.id);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading game...</p>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!game) return null;

  if (game.phase === "finished") {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-600">No item found for this round.</p>
      </div>
    );
  }

  if (game.phase === "results") {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{item.text}</h1>

          <p>Average: {avg.toFixed(2)} / 10</p>

          <div className="space-y-1">
            {Object.entries(distribution).map(([rank, count]) => (
              <div key={rank} className="flex gap-2 items-center">
                <span className="w-4">{rank}:</span>
                <div className="bg-black h-4" style={{ width: count * 10 }} />
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500">Next round in 5 seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6">
      <h1 className="text-3xl font-bold">{item.text}</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {hasVoted ? (
        <p className="text-sm text-gray-600">
          Vote submitted{vote ? `: ${vote}` : ""}
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <button
              key={i}
              onClick={() => submitVote(i + 1)}
              disabled={submitting}
              className={`p-3 border rounded disabled:opacity-50 ${
                vote === i + 1 ? "bg-black text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {isCurrentHost && (
        <button
          onClick={showResults}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Show Results
        </button>
      )}
    </div>
  );
}
