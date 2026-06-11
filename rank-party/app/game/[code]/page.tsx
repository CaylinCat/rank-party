"use client";

import { PartyShell } from "@/components/shell/PartyShell";
import { PartyCard } from "@/components/shell/PartyCard";
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
      <PartyShell>
        <LoadingState message="Loading game..." />
      </PartyShell>
    );
  }

  if (error && !game) {
    return (
      <PartyShell>
        <PartyCard className="max-w-md mx-auto">
          <ErrorState message={error} />
        </PartyCard>
      </PartyShell>
    );
  }

  if (!game) return null;

  if (game.phase === "finished") {
    return (
      <PartyShell>
        <LoadingState message="Loading leaderboard..." />
      </PartyShell>
    );
  }

  if (!item) {
    return (
      <PartyShell>
        <PartyCard className="max-w-md mx-auto">
          <ErrorState message="No item found for this round." />
        </PartyCard>
      </PartyShell>
    );
  }

  if (game.phase === "results") {
    return (
      <PartyShell>
        <PartyCard className="max-w-md mx-auto">
          <ResultsPhase
            item={item}
            avg={avg}
            distribution={distribution}
            resultsSecondsLeft={resultsSecondsLeft}
          />
        </PartyCard>
      </PartyShell>
    );
  }

  if (game.phase === "placement") {
    return (
      <PartyShell>
        <PartyCard className="max-w-md mx-auto">
          <PlacementPhase
            leaderboardEntries={leaderboardEntries}
            placementSecondsLeft={placementSecondsLeft}
          />
        </PartyCard>
      </PartyShell>
    );
  }

  return (
    <PartyShell>
      <PartyCard className="max-w-lg mx-auto">
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
      </PartyCard>
    </PartyShell>
  );
}
