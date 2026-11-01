"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { BannerStack, type Banner } from "@/components/ui/banner-stack/banner-stack";

const ANNOUNCEMENTS: Banner[] = [
  {
    id: "launch",
    tone: "promo",
    title: "Toast Stack just shipped",
    description: "Stacked, swipeable notifications with a promise helper.",
    action: { label: "See it", onClick: () => {} },
  },
  {
    id: "maintenance",
    tone: "warning",
    title: "Scheduled maintenance",
    description: "Deploys pause Sunday, 02:00–03:00 WIB.",
  },
  {
    id: "invite",
    tone: "info",
    title: "Raka invited you to “Design system”",
    action: { label: "Accept", onClick: () => {} },
  },
  {
    id: "backup",
    tone: "success",
    title: "Backups are on",
    description: "Your workspace is backed up every night.",
  },
];

export function Default() {
  const [round, setRound] = useState(0);
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <BannerStack key={round} banners={ANNOUNCEMENTS} />
      <button
        type="button"
        onClick={() => setRound((n) => n + 1)}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reset
      </button>
    </div>
  );
}

export function TwoDeep() {
  const [round, setRound] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <BannerStack
        key={round}
        depth={2}
        banners={ANNOUNCEMENTS.slice(1)}
        onDismiss={(id) => setLog((l) => [...l, id])}
      />
      <p className="h-5 text-[13px] text-muted-foreground">
        {log.length ? `Dismissed: ${log.join(", ")}` : "Showing two cards deep."}
      </p>
      <button
        type="button"
        onClick={() => {
          setRound((n) => n + 1);
          setLog([]);
        }}
        className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Reset
      </button>
    </div>
  );
}
