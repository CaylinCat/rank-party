"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countActivePlayers, isPlayerActive } from "@/lib/playerPresence";
import type { Player } from "@/lib/types";

type PlayerListProps = {
  players: Player[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PlayerList({ players }: PlayerListProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = countActivePlayers(players);

  return (
    <Card className="rounded-3xl border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5" />
          Players ({activeCount} online)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {players.map((player) => {
              const active = isPlayerActive(player);

              return (
                <motion.li
                  key={player.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                    active ? "bg-muted/50" : "bg-muted/25 opacity-70"
                  }`}
                >
                  <Avatar className="size-9">
                    <AvatarFallback
                      className={`text-xs font-semibold ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium">
                    {player.name}
                    {!active && (
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        (disconnected)
                      </span>
                    )}
                  </span>
                  {player.is_host && (
                    <Badge variant="secondary" className="gap-1">
                      <Crown className="size-3" />
                      host
                    </Badge>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </CardContent>
    </Card>
  );
}
