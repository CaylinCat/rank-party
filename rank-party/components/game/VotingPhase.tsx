import { Button } from "@/components/ui/button";
import { CountdownBar } from "@/components/CountdownBar";
import { VOTING_DURATION } from "@/lib/constants";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

type VotingPhaseProps = {
  item: Item;
  voteCount: number;
  playerCount: number;
  secondsLeft: number;
  error: string | null;
  hasVoted: boolean;
  submittedRank: number | null;
  selectedRank: number | null;
  setSelectedRank: (rank: number) => void;
  submitting: boolean;
  submitVote: () => void;
  disabledRanks?: number[];
};

export function VotingPhase({
  item,
  voteCount,
  playerCount,
  secondsLeft,
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
          duration={VOTING_DURATION}
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
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => {
              const rank = i + 1;
              const isDisabled = disabledRanks.includes(rank);

              return (
                <button
                  key={i}
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
