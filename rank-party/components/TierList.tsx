import type { LeaderboardEntry } from "@/lib/types";

type TierListProps = {
  entries: LeaderboardEntry[];
  showEmptySlots?: boolean;
  roundCount?: number;
};

export function TierList({
  entries,
  showEmptySlots = false,
  roundCount = 10,
}: TierListProps) {
  if (!showEmptySlots && entries.length === 0) {
    return <p className="text-gray-500">No rankings yet.</p>;
  }

  const slots = showEmptySlots
    ? Array.from({ length: roundCount }, (_, i) => i + 1)
    : entries.map((e) => e.position);

  return (
    <ol className="space-y-2">
      {slots.map((position) => {
        const entry = entries.find((e) => e.position === position);
        return (
          <li
            key={position}
            className={`text-lg font-semibold ${entry ? "" : "text-muted-foreground/50"}`}
          >
            {position}.{" "}
            {entry ? (entry.items?.text ?? "Unknown") : "—"}
          </li>
        );
      })}
    </ol>
  );
}
