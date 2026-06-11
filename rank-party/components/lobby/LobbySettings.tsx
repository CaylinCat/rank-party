"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MAX_ROUND_COUNT,
  MIN_ROUND_COUNT,
  type GameSettings,
} from "@/lib/gameSettings";
import { cn } from "@/lib/utils";

type LobbySettingsProps = {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  isHost: boolean;
  locked?: boolean;
};

const selectClassName = cn(
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium",
  "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function LobbySettings({
  settings,
  onSettingsChange,
  isHost,
  locked = false,
}: LobbySettingsProps) {
  const canEdit = isHost && !locked;

  function update<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
    if (!canEdit) return;
    onSettingsChange({ ...settings, [key]: value });
  }

  return (
    <Card className="rounded-3xl border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardContent className="space-y-5 pt-6">
        <div className="text-center">
          <h2 className="font-display text-xl font-extrabold">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {locked
              ? "Settings are locked for this game."
              : isHost
                ? "Configure rounds and timers before starting."
                : "The host controls these settings."}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="round-count" className="text-sm font-medium">
            Items to rank
          </label>
          <select
            id="round-count"
            value={settings.roundCount}
            disabled={!canEdit}
            onChange={(e) => update("roundCount", Number(e.target.value))}
            className={selectClassName}
          >
            {Array.from(
              { length: MAX_ROUND_COUNT - MIN_ROUND_COUNT + 1 },
              (_, i) => MIN_ROUND_COUNT + i
            ).map((count) => (
              <option key={count} value={count}>
                {count} items
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="voting-duration" className="text-sm font-medium">
              Voting (sec)
            </label>
            <Input
              id="voting-duration"
              type="number"
              min={5}
              max={120}
              value={settings.votingDuration}
              disabled={!canEdit}
              onChange={(e) =>
                update("votingDuration", Number(e.target.value) || 5)
              }
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="results-duration" className="text-sm font-medium">
              Results (sec)
            </label>
            <Input
              id="results-duration"
              type="number"
              min={3}
              max={60}
              value={settings.resultsDuration}
              disabled={!canEdit}
              onChange={(e) =>
                update("resultsDuration", Number(e.target.value) || 3)
              }
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="placement-duration" className="text-sm font-medium">
              Rankings (sec)
            </label>
            <Input
              id="placement-duration"
              type="number"
              min={3}
              max={60}
              value={settings.placementDuration}
              disabled={!canEdit}
              onChange={(e) =>
                update("placementDuration", Number(e.target.value) || 3)
              }
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
