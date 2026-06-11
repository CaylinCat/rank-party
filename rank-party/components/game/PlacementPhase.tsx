import { CountdownBar } from "@/components/CountdownBar";
import { TierList } from "@/components/TierList";
import { PLACEMENT_DURATION } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/types";

type PlacementPhaseProps = {
  leaderboardEntries: LeaderboardEntry[];
  placementSecondsLeft: number;
};

export function PlacementPhase({
  leaderboardEntries,
  placementSecondsLeft,
}: PlacementPhaseProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-center font-display text-3xl font-extrabold">
        Rankings
      </h1>
      <TierList entries={leaderboardEntries} showEmptySlots />
      <div className="text-center">
        <CountdownBar
          secondsLeft={placementSecondsLeft}
          duration={PLACEMENT_DURATION}
          label=""
        />
      </div>
    </div>
  );
}
