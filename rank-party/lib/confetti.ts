import confetti from "canvas-confetti";

export function firePartyConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 },
  });
}
