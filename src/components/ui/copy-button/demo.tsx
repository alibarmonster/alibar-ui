"use client";

import { CopyButton } from "@/components/ui/copy-button/copy-button";

export function Default() {
  return (
    <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-background py-1 pr-1 pl-3.5 shadow-xs">
      <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
        npm install motion lucide-react
      </code>
      <CopyButton value="npm install motion lucide-react" variant="ghost" size="sm" />
    </div>
  );
}

export function WithLabel() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <CopyButton value="https://example.com/invite/7f3a" label="Copy link" copiedLabel="Link copied" />
      <CopyButton value="ALIBAR-2026" label="Copy code" variant="solid" />
    </div>
  );
}

export function Styles() {
  return (
    <div className="flex items-center gap-3">
      <CopyButton value="outline" aria-label="Copy (outline)" />
      <CopyButton value="ghost" variant="ghost" aria-label="Copy (ghost)" />
      <CopyButton value="solid" variant="solid" aria-label="Copy (solid)" />
      <CopyButton value="small" size="sm" aria-label="Copy (small)" />
    </div>
  );
}
