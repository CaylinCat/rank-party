"use client";

import { motion } from "framer-motion";

export function TitleHero() {
  return (
    <div className="mb-8 text-center text-white">
      <motion.h1
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="font-display text-6xl font-bold leading-none tracking-tight sm:text-7xl"
      >
        RANK
        <br />
        PARTY
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.25 }}
        className="mt-3 text-lg text-white/90 sm:text-xl"
      >
        Rank anything. Fight about everything.
      </motion.p>
    </div>
  );
}
