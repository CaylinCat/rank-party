export function findPosition(target: number, occupied: number[]) {
  if (!occupied.includes(target)) {
    return target;
  }

  for (let distance = 1; distance <= 10; distance++) {
    const higher = target + distance;
    const lower = target - distance;

    if (higher <= 10 && !occupied.includes(higher)) {
      return higher;
    }

    if (lower >= 1 && !occupied.includes(lower)) {
      return lower;
    }
  }

  return target;
}
