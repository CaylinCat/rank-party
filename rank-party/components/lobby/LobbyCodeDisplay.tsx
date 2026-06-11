"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type LobbyCodeDisplayProps = {
  code: string;
};

export function LobbyCodeDisplay({ code }: LobbyCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3 text-center">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Room code
      </h2>
      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 px-8 py-4">
        <p className="font-display text-4xl font-extrabold tracking-widest text-primary">
          {code}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={handleCopy}
        className="w-full rounded-xl"
      >
        {copied ? (
          <>
            <Check className="size-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="size-4" />
            Copy code
          </>
        )}
      </Button>
    </div>
  );
}
