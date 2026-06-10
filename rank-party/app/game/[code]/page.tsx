"use client";

import { PageShell } from "@/components/PageShell";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { VotingPhase } from "@/components/game/VotingPhase";
import { ResultsPhase } from "@/components/game/ResultsPhase";
import { PlacementPhase } from "@/components/game/PlacementPhase";
import { useGame } from "@/hooks/useGame";

export default function GamePage() {
  const {
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
  } = useGame();

  if (loading) {
    return (
      <PageShell>
        <LoadingState message="Loading game..." />
      </PageShell>
    );
  }

  if (error && !game) {
    return (
      <PageShell>
        <ErrorState message={error} />
      </PageShell>
    );
  }

  if (!game) return null;

  if (game.phase === "finished") {
    return (
      <PageShell>
        <LoadingState message="Loading leaderboard..." />
      </PageShell>
    );
  }

  if (!item) {
    return (
      <PageShell>
        <ErrorState message="No item found for this round." />
      </PageShell>
    );
  }

  if (game.phase === "results") {
    return (
      <ResultsPhase
        item={item}
        avg={avg}
        distribution={distribution}
        resultsSecondsLeft={resultsSecondsLeft}
      />
    );
  }

  if (game.phase === "placement") {
    return (
      <PlacementPhase
        leaderboardEntries={leaderboardEntries}
        placementSecondsLeft={placementSecondsLeft}
      />
    );
  }

  return (
    <VotingPhase
      item={item}
      voteCount={voteCount}
      playerCount={playerCount}
      secondsLeft={secondsLeft}
      error={error}
      hasVoted={hasVoted}
      submittedRank={submittedRank}
      selectedRank={selectedRank}
      setSelectedRank={setSelectedRank}
      submitting={submitting}
      submitVote={submitVote}
    />
  );
}
