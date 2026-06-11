"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { fetchGameByCode } from "@/lib/api/games";
import {
  fetchLeaderboard,
  formatTierListText,
} from "@/lib/api/leaderboard";
import { useLobbyCode } from "@/hooks/useLobbyCode";
import { PartyShell } from "@/components/shell/PartyShell";
import { PartyCard } from "@/components/shell/PartyCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { TierList } from "@/components/TierList";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const code = useLobbyCode();
  const router = useRouter();
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
      <PartyShell>
        <LoadingState message="Loading leaderboard..." />
      </PartyShell>
    );
  }

  if (error) {
    return (
      <PartyShell>
        <PartyCard className="max-w-md mx-auto">
          <ErrorState message={error} />
        </PartyCard>
      </PartyShell>
    );
  }

  return (
    <PartyShell>
      <PartyCard className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-extrabold">Rank Party</h1>
          <p className="mt-1 font-semibold text-muted-foreground">
            Code: {code}
          </p>
        </div>

        <TierList entries={entries} showEmptySlots />

        <div className="flex flex-col gap-2">
          <div className="text-center">
            <CopyButton text={formatTierListText(entries)} />
          </div>
          <Button
            size="lg"
            className="w-full rounded-xl"
            onClick={() => router.push(`/lobby/${code}`)}
          >
            <RotateCcw className="size-4" />
            Play again
          </Button>
          <Link href="/" className="block">
            <Button variant="outline" size="lg" className="w-full rounded-xl">
              <ArrowLeft className="size-4" />
              Back home
            </Button>
          </Link>
        </div>
      </PartyCard>
    </PartyShell>
  );
}
