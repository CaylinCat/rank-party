"use client";

import { useEffect, useState } from "react";
import { fetchGameByCode } from "@/lib/api/games";
import {
  fetchLeaderboard,
  formatTierListText,
} from "@/lib/api/leaderboard";
import { useLobbyCode } from "@/hooks/useLobbyCode";
import { PageShell } from "@/components/PageShell";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { TierList } from "@/components/TierList";
import { CopyButton } from "@/components/CopyButton";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const code = useLobbyCode();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data: game, error: gameError } = await fetchGameByCode(code);

      if (gameError || !game) {
        setError("Game not found.");
        setLoading(false);
        return;
      }

      const { data, error: entriesError } = await fetchLeaderboard(game.id);

      if (entriesError) {
        setError(entriesError.message);
        setLoading(false);
        return;
      }

      setEntries(data);
      setLoading(false);
    }

    load();
  }, [code]);

  if (loading) {
    return (
      <PageShell>
        <LoadingState message="Loading leaderboard..." />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorState message={error} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4 w-96">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Rank Party</h1>
          <p className="text-gray-600">Code: {code}</p>
        </div>

        <TierList entries={entries} showEmptySlots />

        <div className="text-center">
          <CopyButton text={formatTierListText(entries)} />
        </div>
      </div>
    </PageShell>
  );
}
