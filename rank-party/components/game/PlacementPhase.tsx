import { CountdownBar } from "@/components/CountdownBar";
import { TierList } from "@/components/TierList";
import type { LeaderboardEntry } from "@/lib/types";

type PlacementPhaseProps = {
  leaderboardEntries: LeaderboardEntry[];
  placementSecondsLeft: number;
  placementDuration: number;
  roundCount: number;
};

export function PlacementPhase({
  leaderboardEntries,
  placementSecondsLeft,
  placementDuration,
  roundCount,
}: PlacementPhaseProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-center font-display text-3xl font-extrabold">
        Rankings
      </h1>
      <TierList
        entries={leaderboardEntries}
        showEmptySlots
        roundCount={roundCount}
      />
      <div className="text-center">
        <CountdownBar
          secondsLeft={placementSecondsLeft}
          duration={placementDuration}
          label=""
        />
      </div>
    </div>
  );
}
