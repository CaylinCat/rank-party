import { CountdownBar } from "@/components/CountdownBar";
import { VOTING_DURATION } from "@/lib/constants";
import type { Item } from "@/lib/types";

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
}: VotingPhaseProps) {
  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{item.text}</h1>
        <p className="text-sm text-gray-600">
          {voteCount}/{playerCount} players voted
        </p>
        <CountdownBar
          secondsLeft={secondsLeft}
          duration={VOTING_DURATION}
          label=""
        />
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
