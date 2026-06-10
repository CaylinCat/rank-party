import { ROUND_COUNT } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/types";

type TierListProps = {
  entries: LeaderboardEntry[];
  showEmptySlots?: boolean;
};

export function TierList({
  entries,
  showEmptySlots = false,
}: TierListProps) {
  const slotCount = showEmptySlots ? ROUND_COUNT : entries.length;

  if (!showEmptySlots && entries.length === 0) {
    return <p className="text-gray-500">No rankings yet.</p>;
  }

  const slots = showEmptySlots
    ? Array.from({ length: ROUND_COUNT }, (_, i) => i + 1)
    : entries.map((e) => e.position);

  return (
    <ol className="space-y-2">
      {slots.map((position) => {
        const entry = entries.find((e) => e.position === position);
        return (
          <li
            key={position}
            className={`text-lg ${entry ? "" : "text-gray-300"}`}
          >
            {position}.{" "}
            {entry ? (entry.items?.text ?? "Unknown") : "—"}
          </li>
        );
      })}
    </ol>
  );
}
