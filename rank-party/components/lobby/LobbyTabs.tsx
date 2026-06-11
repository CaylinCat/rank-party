"use client";

import { cn } from "@/lib/utils";

export type LobbyTab = "lobby" | "modes" | "settings";

type LobbyTabsProps = {
  activeTab: LobbyTab;
  onTabChange: (tab: LobbyTab) => void;
};

const TABS: { id: LobbyTab; label: string }[] = [
  { id: "lobby", label: "Lobby" },
  { id: "modes", label: "Modes" },
  { id: "settings", label: "Settings" },
];

export function LobbyTabs({ activeTab, onTabChange }: LobbyTabsProps) {
  return (
    <div className="mb-6 flex justify-center">
      <div className="inline-flex rounded-2xl bg-white/20 p-1 backdrop-blur-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-xl px-6 py-2.5 text-sm font-bold transition-colors",
              activeTab === tab.id
                ? "bg-white text-foreground shadow-md"
                : "text-white hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
