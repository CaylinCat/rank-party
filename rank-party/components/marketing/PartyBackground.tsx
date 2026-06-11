"use client";

import { motion } from "framer-motion";

const FLOATING_NUMBERS = Array.from({ length: 10 }, (_, i) => i + 1);

export function PartyBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLOATING_NUMBERS.map((num, i) => (
        <motion.span
          key={num}
          className="absolute font-display text-6xl font-bold text-white/20 select-none"
          style={{
            left: `${8 + (i % 5) * 18}%`,
            top: `${10 + Math.floor(i / 5) * 40 + (i % 3) * 8}%`,
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0.12, 0.28, 0.12],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        >
          {num}
        </motion.span>
      ))}
    </div>
  );
}
