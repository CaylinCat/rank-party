"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { calculateResults } from "@/lib/calculateResults";
import { fetchGameByCode, fetchItems, setGamePhase } from "@/lib/api/games";
import {
  fetchExistingVote,
  fetchVoteProgress,
  fetchVotesForItem,
  submitVote as apiSubmitVote,
} from "@/lib/api/votes";
import { fetchLeaderboard } from "@/lib/api/leaderboard";
import {
  advanceToNextRound,
  saveRoundPlacement,
} from "@/lib/processRound";
import {
  PLACEMENT_DURATION,
  RESULTS_DURATION,
  VOTING_DURATION,
} from "@/lib/constants";
import { getPlayerId, isHost } from "@/lib/playerSession";
import type { Game, Item, LeaderboardEntry } from "@/lib/types";
import { useLobbyCode } from "./useLobbyCode";

const EMPTY_DISTRIBUTION = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i + 1, 0])
) as Record<number, number>;

export function useGame() {
  const code = useLobbyCode();
  const router = useRouter();

  const [game, setGame] = useState<Game | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
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
    const progress = await fetchVoteProgress(gameId, itemId);
    setPlayerCount(progress.totalPlayers);
    setVoteCount(progress.totalVotes);
    return progress;
  }, []);

  const loadExistingVote = useCallback(
    async (itemId: string, playerId: string) => {
      const { data } = await fetchExistingVote(itemId, playerId);
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
    const { data: votes } = await fetchVotesForItem(itemId);
    const results = calculateResults(votes || []);
    setAvg(results.avg);
    setDistribution(results.distribution);
  }, []);

  const clearResults = useCallback(() => {
    setAvg(0);
    setDistribution(EMPTY_DISTRIBUTION);
  }, []);

  const loadLeaderboard = useCallback(async (gameId: string) => {
    const { data, error: entriesError } = await fetchLeaderboard(gameId);
    if (entriesError) {
      console.error(entriesError);
      return;
    }
    setLeaderboardEntries(data);
  }, []);

  const goToResults = useCallback(async () => {
    if (!isHost()) return;
    const g = gameRef.current;
    const currentItem = itemRef.current;
    if (!g || !currentItem || g.phase !== "voting") return;

    const { error: updateError } = await setGamePhase(g.id, "results", "voting");
    if (updateError) console.error(updateError);
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
    setSelectedRank(null);
    setSubmittedRank(null);
    setHasVoted(false);
    clearResults();
  }, [clearResults]);

  const load = useCallback(async () => {
    setError(null);

    const { data: g, error: gameError } = await fetchGameByCode(code);
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

    const { data: items, error: itemsError } = await fetchItems(g.id);
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

    if (
      g.phase === "voting" &&
      roundKey &&
      roundKey !== lastVotingRoundRef.current
    ) {
      resetRoundUi();
      lastVotingRoundRef.current = roundKey;
      timerRoundRef.current = null;
    }

    setGame(g);
    setItem(currentItem);

    if (g.phase === "voting" && currentItem) {
      if ((g.current_item_index ?? 0) === 0) {
        setLeaderboardEntries([]);
      }
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
  }, [
    game?.id,
    game?.phase,
    item?.id,
    loadVoteProgress,
    maybeAutoAdvanceToResults,
  ]);

  useEffect(() => {
    if (game?.phase === "finished") {
      router.push(`/leaderboard/${code}`);
    }
  }, [game?.phase, code, router]);

  const [secondsLeft, setSecondsLeft] = useState(VOTING_DURATION);
  const [resultsSecondsLeft, setResultsSecondsLeft] =
    useState(RESULTS_DURATION);
  const [placementSecondsLeft, setPlacementSecondsLeft] =
    useState(PLACEMENT_DURATION);

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
            if (isHost()) saveRoundPlacement(game, item);
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
            if (isHost()) advanceToNextRound(game);
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
    if (!game || !item || hasVoted || submitting || selectedRank === null)
      return;

    const playerId = getPlayerId();
    if (!playerId) {
      setError("Join the lobby first so we know who you are.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: voteError } = await apiSubmitVote(
      game.id,
      item.id,
      playerId,
      selectedRank
    );

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

  return {
    game,
    item,
    loading,
    error,
    selectedRank,
    setSelectedRank,
    submittedRank,
    hasVoted,
    playerCount,
    voteCount,
    secondsLeft,
    resultsSecondsLeft,
    placementSecondsLeft,
    leaderboardEntries,
    avg,
    distribution,
    submitting,
    submitVote,
  };
}
