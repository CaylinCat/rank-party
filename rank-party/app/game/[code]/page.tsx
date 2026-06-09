"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculateResults } from "@/lib/calculateResults";
import { advanceToNextRound, saveRoundPlacement } from "@/lib/processRound";
import { getPlayerId, isHost } from "@/lib/playerSession";
import type { RealtimeChannel } from "@supabase/supabase-js";

const VOTING_DURATION = 30;
const RESULTS_DURATION = 5;
const PLACEMENT_DURATION = 5;

type LeaderboardEntry = {
  id: string;
  item_id: string;
  position: number;
  average_score: number;
  items: { text: string } | null;
};

const EMPTY_DISTRIBUTION = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i + 1, 0])
) as Record<number, number>;

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [game, setGame] = useState<any>(null);
  const [item, setItem] = useState<any>(null);
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(VOTING_DURATION);
  const [resultsSecondsLeft, setResultsSecondsLeft] = useState(RESULTS_DURATION);
  const [placementSecondsLeft, setPlacementSecondsLeft] =
    useState(PLACEMENT_DURATION);
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    LeaderboardEntry[]
  >([]);
  const [avg, setAvg] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>(
    EMPTY_DISTRIBUTION
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const gameRef = useRef(game);
  const itemRef = useRef(item);
  const timerRoundRef = useRef<string | null>(null);
  const lastVotingRoundRef = useRef<string | null>(null);

  gameRef.current = game;
  itemRef.current = item;

  const loadVoteProgress = useCallback(async (gameId: string, itemId: string) => {
    const [{ count }, { data: votes }] = await Promise.all([
      supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("game_id", gameId),
      supabase.from("votes").select("player_id").eq("item_id", itemId),
    ]);

    const totalPlayers = count ?? 0;
    const totalVotes = votes?.length ?? 0;

    setPlayerCount(totalPlayers);
    setVoteCount(totalVotes);

    return { totalPlayers, totalVotes };
  }, []);

  const loadExistingVote = useCallback(
    async (itemId: string, playerId: string) => {
      const { data } = await supabase
        .from("votes")
        .select("rank")
        .eq("item_id", itemId)
        .eq("player_id", playerId)
        .maybeSingle();

      if (data) {
        setSubmittedRank(data.rank);
        setSelectedRank(data.rank);
        setHasVoted(true);
      } else {
        setSubmittedRank(null);
        setSelectedRank(null);
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

  const clearResults = useCallback(() => {
    setAvg(0);
    setDistribution(EMPTY_DISTRIBUTION);
  }, []);

  const loadLeaderboard = useCallback(async (gameId: string) => {
    const { data, error: entriesError } = await supabase
      .from("leaderboard_entries")
      .select("id, item_id, position, average_score, items(text)")
      .eq("game_id", gameId)
      .order("position", { ascending: true });

    if (entriesError) {
      console.error(entriesError);
      return;
    }

    setLeaderboardEntries((data as unknown as LeaderboardEntry[]) || []);
  }, []);

  const goToResults = useCallback(async () => {
    if (!isHost()) return;

    const g = gameRef.current;
    const currentItem = itemRef.current;
    if (!g || !currentItem || g.phase !== "voting") return;

    const { error: updateError } = await supabase
      .from("games")
      .update({ phase: "results" })
      .eq("id", g.id)
      .eq("phase", "voting");

    if (updateError) {
      console.error(updateError);
    }
  }, []);

  const maybeAutoAdvanceToResults = useCallback(
    async (totalVotes: number, totalPlayers: number) => {
      if (!isHost()) return;
      if (totalPlayers === 0 || totalVotes < totalPlayers) return;
      await goToResults();
    },
    [goToResults]
  );

  const resetRoundUi = useCallback(() => {
    setVoteCount(0);
    setPlayerCount(0);
    setSecondsLeft(VOTING_DURATION);
    setSelectedRank(null);
    setSubmittedRank(null);
    setHasVoted(false);
    clearResults();
  }, [clearResults]);

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
    const roundKey = currentItem
      ? `${g.id}-${g.current_item_index}-${currentItem.id}`
      : null;

    if (g.phase === "voting" && roundKey && roundKey !== lastVotingRoundRef.current) {
      resetRoundUi();
      lastVotingRoundRef.current = roundKey;
      timerRoundRef.current = null;
    }

    setGame(g);
    setItem(currentItem);

    if (g.phase === "voting" && currentItem) {
      const playerId = getPlayerId();
      const progress = await loadVoteProgress(g.id, currentItem.id);

      if (playerId) {
        await loadExistingVote(currentItem.id, playerId);
      }

      await maybeAutoAdvanceToResults(
        progress.totalVotes,
        progress.totalPlayers
      );
    } else if (g.phase === "results" && currentItem) {
      await loadResults(currentItem.id);
    } else if (g.phase === "placement") {
      await loadLeaderboard(g.id);
    } else {
      clearResults();
    }

    setLoading(false);
    return g;
  }, [
    code,
    clearResults,
    loadExistingVote,
    loadLeaderboard,
    loadResults,
    loadVoteProgress,
    maybeAutoAdvanceToResults,
    resetRoundUi,
  ]);

  useEffect(() => {
    let cancelled = false;
    let gameChannel: RealtimeChannel | null = null;

    async function init() {
      const g = await load();
      if (!g || cancelled) return;

      gameChannel = supabase
        .channel(`game-${code}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${g.id}`,
          },
          () => load()
        )
        .subscribe();
    }

    init();

    return () => {
      cancelled = true;
      if (gameChannel) supabase.removeChannel(gameChannel);
    };
  }, [code, load]);

  useEffect(() => {
    if (!game || !item || game.phase !== "voting") return;

    const gameId = game.id;
    const itemId = item.id;

    const votesChannel = supabase
      .channel(`votes-${gameId}-${itemId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `item_id=eq.${itemId}`,
        },
        async () => {
          const progress = await loadVoteProgress(gameId, itemId);
          await maybeAutoAdvanceToResults(
            progress.totalVotes,
            progress.totalPlayers
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
    };
  }, [game?.id, game?.phase, item?.id, loadVoteProgress, maybeAutoAdvanceToResults]);

  useEffect(() => {
    if (game?.phase === "finished") {
      router.push(`/leaderboard/${code}`);
    }
  }, [game?.phase, code, router]);

  useEffect(() => {
    if (!game || !item) return;

    const roundKey = `${game.id}-${game.current_item_index}-${game.phase}`;
    if (timerRoundRef.current === roundKey) return;
    timerRoundRef.current = roundKey;

    if (game.phase === "results") {
      setResultsSecondsLeft(RESULTS_DURATION);
      const interval = setInterval(() => {
        setResultsSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (isHost()) {
              saveRoundPlacement(game, item);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    if (game.phase === "placement") {
      setPlacementSecondsLeft(PLACEMENT_DURATION);
      const interval = setInterval(() => {
        setPlacementSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (isHost()) {
              advanceToNextRound(game);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    if (game.phase === "voting") {
      setSecondsLeft(VOTING_DURATION);
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            goToResults();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [game?.phase, game?.id, game?.current_item_index, item?.id, goToResults]);

  async function submitVote() {
    if (!game || !item || hasVoted || submitting || selectedRank === null) return;

    const playerId = getPlayerId();
    if (!playerId) {
      setError("Join the lobby first so we know who you are.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: voteError } = await supabase.from("votes").insert({
      game_id: game.id,
      item_id: item.id,
      player_id: playerId,
      rank: selectedRank,
    });

    if (voteError) {
      console.error(voteError);
      setError(voteError.message);
      setSubmitting(false);
      return;
    }

    setSubmittedRank(selectedRank);
    setHasVoted(true);
    setSubmitting(false);
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
          <p className="text-lg font-medium tabular-nums">{resultsSecondsLeft}s</p>
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-black transition-all duration-1000 ease-linear"
              style={{
                width: `${(resultsSecondsLeft / RESULTS_DURATION) * 100}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-500">
            Rankings in {resultsSecondsLeft} second
            {resultsSecondsLeft === 1 ? "" : "s"}...
          </p>
        </div>
      </div>
    );
  }

  if (game.phase === "placement") {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-4">
        <div className="space-y-4 w-96">
          <h1 className="text-3xl font-bold text-center">Rankings</h1>
          <ol className="space-y-2">
            {Array.from({ length: 10 }, (_, i) => {
              const position = i + 1;
              const entry = leaderboardEntries.find(
                (e) => e.position === position
              );
              return (
                <li
                  key={position}
                  className={`text-lg ${entry ? "" : "text-gray-300"}`}
                >
                  {position}.{" "}
                  {entry
                    ? `${entry.items?.text ?? "Unknown"} (${entry.average_score.toFixed(1)})`
                    : "—"}
                </li>
              );
            })}
          </ol>
          <p className="text-lg font-medium tabular-nums text-center">
            {placementSecondsLeft}s
          </p>
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-black transition-all duration-1000 ease-linear"
              style={{
                width: `${(placementSecondsLeft / PLACEMENT_DURATION) * 100}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Next round in {placementSecondsLeft} second
            {placementSecondsLeft === 1 ? "" : "s"}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{item.text}</h1>
        <p className="text-sm text-gray-600">
          {voteCount}/{playerCount} players voted
        </p>
        <p className="text-lg font-medium tabular-nums">{secondsLeft}s</p>
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <div
            className="h-full bg-black transition-all duration-1000 ease-linear"
            style={{ width: `${(secondsLeft / VOTING_DURATION) * 100}%` }}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {hasVoted ? (
        <p className="text-sm text-gray-600">Vote submitted: {submittedRank}</p>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => {
              const rank = i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedRank(rank)}
                  disabled={submitting}
                  className={`p-3 border rounded disabled:opacity-50 ${
                    selectedRank === rank ? "bg-black text-white" : ""
                  }`}
                >
                  {rank}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={submitVote}
            disabled={submitting || selectedRank === null}
            className="px-6 py-3 bg-black text-white rounded-xl disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Vote"}
          </button>
        </>
      )}
    </div>
  );
}
