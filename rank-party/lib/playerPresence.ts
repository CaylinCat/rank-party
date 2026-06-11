import { PRESENCE_ACTIVE_MS, PRESENCE_STALE_MS } from "@/lib/constants";
import type { Player } from "@/lib/types";

export function isPlayerActive(player: Player) {
  if (!player.last_seen) return true;
  return Date.now() - new Date(player.last_seen).getTime() < PRESENCE_ACTIVE_MS;
}

export function isPlayerVisible(player: Player) {
  if (!player.last_seen) return true;
  return Date.now() - new Date(player.last_seen).getTime() < PRESENCE_STALE_MS;
}

export function countActivePlayers(players: Player[]) {
  return players.filter(isPlayerActive).length;
}
