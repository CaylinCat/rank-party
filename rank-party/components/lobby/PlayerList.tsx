"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <Card className="rounded-3xl border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5" />
          Players ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {players.map((player) => (
              <motion.li
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 font-medium">{player.name}</span>
                {player.is_host && (
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="size-3" />
                    host
                  </Badge>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </CardContent>
    </Card>
  );
}
