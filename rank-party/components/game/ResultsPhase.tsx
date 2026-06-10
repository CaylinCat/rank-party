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
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{item.text}</h1>
        <p>Average: {avg.toFixed(2)} / 10</p>
        <div className="space-y-1">
          {Object.entries(distribution).map(([rank, count]) => (
            <div key={rank} className="flex gap-2 items-center">
              <span className="w-4">{rank}:</span>
              <div className="bg-black h-4" style={{ width: count * 10 }} />
            </div>
          ))}
        </div>
        <CountdownBar
          secondsLeft={resultsSecondsLeft}
          duration={RESULTS_DURATION}
          label={`Rankings in ${resultsSecondsLeft} second${resultsSecondsLeft === 1 ? "" : "s"}...`}
        />
      </div>
    </div>
  );
}
