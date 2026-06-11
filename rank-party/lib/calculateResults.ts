import { emptyRankDistribution } from "@/lib/gameSettings";

export function calculateResults(
  votes: { rank: number }[],
  rankCount: number
) {
  const total = votes.reduce((sum, v) => sum + v.rank, 0);
  const avg = votes.length > 0 ? total / votes.length : 0;
  const distribution = emptyRankDistribution(rankCount);

  votes.forEach((v) => {
    if (v.rank >= 1 && v.rank <= rankCount) {
      distribution[v.rank]++;
    }
  });

  return { avg, distribution };
}
