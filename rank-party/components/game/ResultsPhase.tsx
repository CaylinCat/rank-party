import { CountdownBar } from "@/components/CountdownBar";
import { RESULTS_DURATION } from "@/lib/constants";
import type { Item } from "@/lib/types";

type ResultsPhaseProps = {
  item: Item;
  avg: number;
  distribution: Record<number, number>;
  resultsSecondsLeft: number;
};

export function ResultsPhase({
  item,
  avg,
  distribution,
  resultsSecondsLeft,
}: ResultsPhaseProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-center font-display text-3xl font-extrabold">
        {item.text}
      </h1>
      <p className="text-center text-lg font-bold">
        Average: {avg.toFixed(2)} / 10
      </p>
      <div className="space-y-1">
        {Object.entries(distribution).map(([rank, count]) => (
          <div key={rank} className="flex items-center gap-2">
            <span className="w-4 font-bold">{rank}:</span>
            <div
              className="h-4 rounded-sm bg-primary"
              style={{ width: Math.max(count * 10, count > 0 ? 4 : 0) }}
            />
          </div>
        ))}
      </div>
      <div className="text-center">
        <CountdownBar
          secondsLeft={resultsSecondsLeft}
          duration={RESULTS_DURATION}
          label=""
        />
      </div>
    </div>
  );
}
