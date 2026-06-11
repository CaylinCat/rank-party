"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import {
  ensureLobbySession,
  fetchLatestFinishedSessionByCode,
  fetchSessionById,
} from "@/lib/api/games";
import {
  fetchLeaderboard,
  formatTierListText,
} from "@/lib/api/leaderboard";
import { getGameId } from "@/lib/playerSession";
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
  const [playAgainLoading, setPlayAgainLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const storedGameId = getGameId();
      let sessionId: string | null = null;

      if (storedGameId) {
        const { data: storedSession } = await fetchSessionById(storedGameId);
        if (
          storedSession?.lobby_code === code.toUpperCase() &&
          storedSession.status === "finished"
        ) {
          sessionId = storedSession.id;
        }
      }

      if (!sessionId) {
        const { data: finished, error: gameError } =
          await fetchLatestFinishedSessionByCode(code);

        if (gameError || !finished) {
          setError("Game not found.");
          setLoading(false);
          return;
        }

        sessionId = finished.id;
      }

      const { data, error: entriesError } = await fetchLeaderboard(sessionId);

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

  async function handlePlayAgain() {
    setPlayAgainLoading(true);
    setError(null);

    const { error: sessionError } = await ensureLobbySession(code);

    if (sessionError) {
      setError(sessionError.message);
      setPlayAgainLoading(false);
      return;
    }

    router.push(`/lobby/${code}`);
  }

  if (loading) {
    return (
      <PartyShell>
        <LoadingState message="Loading leaderboard..." />
      </PartyShell>
    );
  }

  if (error && entries.length === 0) {
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
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button
            size="lg"
            className="w-full rounded-xl"
            disabled={playAgainLoading}
            onClick={handlePlayAgain}
          >
            <RotateCcw className="size-4" />
            {playAgainLoading ? "Setting up lobby..." : "Play again"}
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
