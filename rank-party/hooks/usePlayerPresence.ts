"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getPlayerId } from "@/lib/playerSession";

export function usePlayerPresence() {
  useEffect(() => {
    const playerId = getPlayerId();
    if (!playerId) return;

    async function ping() {
      await supabase
        .from("players")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", playerId);
    }

    void ping();

    const interval = setInterval(() => {
      void ping();
    }, 10_000);

    return () => clearInterval(interval);
  }, []);
}
