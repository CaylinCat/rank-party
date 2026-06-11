"use client";

import { motion } from "framer-motion";

export function WaitingPulse() {
  return (
    <div className="flex flex-col items-center gap-3 text-white">
      <p className="text-lg font-medium">Waiting for host to start...</p>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-3 rounded-full bg-white"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
