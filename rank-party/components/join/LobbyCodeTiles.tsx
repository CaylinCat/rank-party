"use client";

import { Input } from "@/components/ui/input";

type LobbyCodeTilesProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function LobbyCodeTiles({
  value,
  onChange,
  disabled,
}: LobbyCodeTilesProps) {
  function handleChange(raw: string) {
    onChange(raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4));
  }

  return (
    <div className="space-y-2">
      <label htmlFor="lobby-code" className="text-sm font-semibold">
        Lobby code
      </label>
      <Input
        id="lobby-code"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        placeholder="ABCD"
        className="h-14 rounded-2xl text-center font-display text-2xl font-extrabold tracking-widest uppercase"
        autoComplete="off"
        maxLength={4}
      />
    </div>
  );
}
