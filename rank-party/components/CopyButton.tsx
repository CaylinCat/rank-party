"use client";

import { useState } from "react";

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
    <button
      type="button"
      onClick={handleCopy}
      className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
