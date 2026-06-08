export function calculateResults(votes: { rank: number }[]) {
  const total = votes.reduce((sum, v) => sum + v.rank, 0);
  const avg = votes.length > 0 ? total / votes.length : 0;

  const distribution: Record<number, number> = {};

  for (let i = 1; i <= 10; i++) distribution[i] = 0;

  votes.forEach((v) => {
    distribution[v.rank]++;
  });

  return { avg, distribution };
}
