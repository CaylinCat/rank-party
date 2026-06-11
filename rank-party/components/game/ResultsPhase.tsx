import { CountdownBar } from "@/components/CountdownBar";
import type { Item } from "@/lib/types";

type ResultsPhaseProps = {
  item: Item;
  avg: number;
  distribution: Record<number, number>;
  resultsSecondsLeft: number;
  resultsDuration: number;
  isPopular?: boolean;
  popularMode?: number | null;
  isTie?: boolean;
};

export function ResultsPhase({
  item,
  avg,
  distribution,
  resultsSecondsLeft,
  resultsDuration,
  isPopular = false,
  popularMode = null,
  isTie = false,
}: ResultsPhaseProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-center font-display text-3xl font-extrabold">
        {item.text}
      </h1>
      {isPopular ? (
        <p className="text-center text-lg font-bold">
          {isTie ? "Tie!" : `Most popular rank: ${popularMode}`}
        </p>
      ) : (
        <p className="text-center text-lg font-bold">
          Average: {avg.toFixed(2)} / 10
        </p>
      )}
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
          duration={resultsDuration}
          label=""
        />
      </div>
    </div>
  );
}
