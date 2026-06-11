export function findPosition(
  target: number,
  occupied: number[],
  maxRank: number
) {
  const clamped = Math.min(maxRank, Math.max(1, target));

  if (!occupied.includes(clamped)) {
    return clamped;
  }

  for (let distance = 1; distance <= maxRank; distance++) {
    const higher = clamped + distance;
    const lower = clamped - distance;

    if (higher <= maxRank && !occupied.includes(higher)) {
      return higher;
    }

    if (lower >= 1 && !occupied.includes(lower)) {
      return lower;
    }
  }

  return clamped;
}
