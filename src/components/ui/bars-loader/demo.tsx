"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { BarsLoader } from "@/components/ui/bars-loader/bars-loader";

export function Default() {
  return (
    <div className="flex items-end gap-10 text-foreground">
      <BarsLoader />
      <BarsLoader bars={7} height={28} barWidth={4} gap={3} className="text-primary" />
      <BarsLoader bars={4} height={14} barWidth={2} speed={1.4} className="text-muted-foreground" />
    </div>
  );
}

export function NowPlaying() {
  const [playing, setPlaying] = useState(true);
  return (
    <div className="flex w-full max-w-xs items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
      <span className="size-11 shrink-0 rounded-lg bg-gradient-to-br from-rose-300 via-fuchsia-400 to-indigo-500" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">Golden Hour Loops</p>
        <p className="truncate text-xs text-muted-foreground">Sunset Radio</p>
      </div>
      <BarsLoader playing={playing} bars={4} height={16} label={playing ? "Playing" : "Paused"} className="text-primary" />
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause" : "Play"}
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-foreground text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {playing ? <Pause className="size-4 fill-current" aria-hidden="true" /> : <Play className="size-4 fill-current" aria-hidden="true" />}
      </button>
    </div>
  );
}
