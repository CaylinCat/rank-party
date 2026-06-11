import { emptyRankDistribution } from "@/lib/gameSettings";

export function calculatePopularResults(
  votes: { rank: number }[],
  rankCount: number
) {
  const distribution = emptyRankDistribution(rankCount);

  votes.forEach((v) => {
    if (v.rank >= 1 && v.rank <= rankCount) {
      distribution[v.rank]++;
    }
  });

  const votedRanks = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([rank]) => Number(rank));

  if (votedRanks.length === 0) {
    return { mode: null as number | null, distribution, isTie: false };
  }

  const maxCount = Math.max(...votedRanks.map((rank) => distribution[rank]));
  const topRanks = votedRanks.filter((rank) => distribution[rank] === maxCount);
  const isTie = topRanks.length > 1;

  return {
    mode: isTie ? null : (topRanks[0] ?? null),
    distribution,
    isTie,
  };
}
