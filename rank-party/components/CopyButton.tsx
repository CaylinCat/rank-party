"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyButtonProps = {
  text: string;
  label?: string;
};

export function CopyButton({ text, label = "Copy tier list" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleCopy}
      className="rounded-xl"
      size="lg"
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copied!
        </>
      ) : (
        label
      )}
    </Button>
  );
}
