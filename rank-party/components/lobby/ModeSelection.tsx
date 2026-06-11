"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  GAME_MODES,
  type GameMode,
  type GameModeOption,
} from "@/lib/gameModes";
import { cn } from "@/lib/utils";

type ModeSelectionProps = {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  isHost: boolean;
};

function ModeCard({
  mode,
  selected,
  onSelect,
  disabled,
}: {
  mode: GameModeOption;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled || !mode.available}
      className={cn(
        "w-full rounded-2xl border-2 p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-background hover:border-primary/40",
        (!mode.available || disabled) && "opacity-80",
        disabled && "cursor-default"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-extrabold">{mode.label}</h3>
            {!mode.available && (
              <Badge variant="secondary" className="text-xs">
                Coming soon
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
        </div>
        {selected && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </span>
        )}
      </div>
      <ul className="mt-3 space-y-1.5">
        {mode.details.map((detail) => (
          <li
            key={detail}
            className="flex gap-2 text-sm text-muted-foreground"
          >
            <span className="text-primary">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

export function ModeSelection({
  selectedMode,
  onModeChange,
  isHost,
}: ModeSelectionProps) {
  return (
    <Card className="rounded-3xl border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="text-center">
          <h2 className="font-display text-xl font-extrabold">Game mode</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isHost
              ? "Choose how this lobby will rank items."
              : "The host picks the mode before starting."}
          </p>
        </div>

        <div className="space-y-3">
          {GAME_MODES.map((mode) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              selected={selectedMode === mode.id}
              onSelect={() => onModeChange(mode.id)}
              disabled={!isHost}
            />
          ))}
        </div>

        {!isHost && (
          <p className="text-center text-sm font-semibold text-muted-foreground">
            Selected:{" "}
            <span className="text-foreground">
              {GAME_MODES.find((m) => m.id === selectedMode)?.label ?? "Normal"}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
