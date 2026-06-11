import { Button } from "@/components/ui/button";
import { CountdownBar } from "@/components/CountdownBar";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

type VotingPhaseProps = {
  item: Item;
  voteCount: number;
  playerCount: number;
  secondsLeft: number;
  votingDuration: number;
  rankCount: number;
  error: string | null;
  hasVoted: boolean;
  submittedRank: number | null;
  selectedRank: number | null;
  setSelectedRank: (rank: number) => void;
  submitting: boolean;
  submitVote: () => void;
  disabledRanks?: number[];
};

function rankGridClass(rankCount: number) {
  if (rankCount <= 3) return "grid-cols-3";
  if (rankCount <= 5) return "grid-cols-5";
  if (rankCount <= 6) return "grid-cols-3";
  if (rankCount <= 8) return "grid-cols-4";
  return "grid-cols-5";
}

export function VotingPhase({
  item,
  voteCount,
  playerCount,
  secondsLeft,
  votingDuration,
  rankCount,
  error,
  hasVoted,
  submittedRank,
  selectedRank,
  setSelectedRank,
  submitting,
  submitVote,
  disabledRanks = [],
}: VotingPhaseProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-extrabold">{item.text}</h1>
        <p className="text-sm font-semibold text-muted-foreground">
          {voteCount}/{playerCount} players voted
        </p>
        <CountdownBar
          secondsLeft={secondsLeft}
          duration={votingDuration}
          label=""
        />
      </div>

      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

      {hasVoted ? (
        <p className="text-sm font-semibold text-muted-foreground">
          Vote submitted: {submittedRank}
        </p>
      ) : (
        <>
          <div className={cn("grid w-full max-w-sm gap-2", rankGridClass(rankCount))}>
            {Array.from({ length: rankCount }).map((_, i) => {
              const rank = i + 1;
              const isDisabled = disabledRanks.includes(rank);

              return (
                <button
                  key={rank}
                  type="button"
                  onClick={() => setSelectedRank(rank)}
                  disabled={submitting || isDisabled}
                  className={cn(
                    "rounded-xl border-2 p-3 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    selectedRank === rank
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {rank}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            onClick={submitVote}
            disabled={submitting || selectedRank === null}
            size="lg"
            className="rounded-xl px-8"
          >
            {submitting ? "Submitting..." : "Submit Vote"}
          </Button>
        </>
      )}
    </div>
  );
}
