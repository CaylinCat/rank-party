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
    <div className="h-screen flex flex-col items-center justify-center px-4">
      <div className="space-y-4 w-96">
        <h1 className="text-3xl font-bold text-center">Rankings</h1>
        <TierList entries={leaderboardEntries} showEmptySlots />
        <CountdownBar
          secondsLeft={placementSecondsLeft}
          duration={PLACEMENT_DURATION}
          label={`Next round in ${placementSecondsLeft} second${placementSecondsLeft === 1 ? "" : "s"}...`}
        />
      </div>
    </div>
  );
}
