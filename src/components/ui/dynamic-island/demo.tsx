"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, Pause, Play, SkipBack, SkipForward, Timer } from "lucide-react";
import { DynamicIsland } from "@/components/ui/dynamic-island/dynamic-island";

type View = "idle" | "timer" | "music" | "player" | "call";

const pill =
  "inline-flex h-8 cursor-pointer items-center rounded-full border border-border bg-background px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background";

function useClock(running: boolean) {
  const [seconds, setSeconds] = useState(754);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function Default() {
  const [view, setView] = useState<View>("music");
  const [playing, setPlaying] = useState(true);
  const clock = useClock(view === "timer");

  const content = {
    idle: undefined,
    timer: (
      <div className="flex h-9 w-56 items-center justify-between px-3">
        <Timer className="size-4 text-amber-400" aria-hidden="true" />
        <span className="font-mono text-sm text-amber-400 tabular-nums">{clock}</span>
      </div>
    ),
    music: (
      <button type="button" onClick={() => setView("player")} aria-label="Expand now playing" className="flex h-9 w-60 cursor-pointer items-center justify-between px-2">
        <span className="size-6 rounded-md bg-gradient-to-br from-rose-400 to-violet-600" aria-hidden="true" />
        <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
          {[0.5, 1, 0.7, 0.9].map((h, i) => (
            <span key={i} className="w-0.5 rounded-full bg-rose-400" style={{ height: `${h * 100}%` }} />
          ))}
        </span>
      </button>
    ),
    player: (
      <div className="w-[min(22rem,calc(100vw-4rem))] p-4">
        <div className="flex items-center gap-3">
          <span className="size-14 shrink-0 rounded-xl bg-gradient-to-br from-rose-400 to-violet-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Golden Hour Loops</p>
            <p className="truncate text-xs text-white/60">Sunset Radio</p>
          </div>
          <button type="button" onClick={() => setView("music")} className="cursor-pointer rounded-full px-2 py-1 text-xs text-white/60 hover:text-white">
            Collapse
          </button>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
          <div className="h-full w-2/5 rounded-full bg-white" />
        </div>
        <div className="mt-3 flex items-center justify-center gap-6">
          <button type="button" aria-label="Previous" className="cursor-pointer text-white/80 hover:text-white">
            <SkipBack className="size-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)} className="cursor-pointer">
            {playing ? <Pause className="size-7" aria-hidden="true" /> : <Play className="size-7" aria-hidden="true" />}
          </button>
          <button type="button" aria-label="Next" className="cursor-pointer text-white/80 hover:text-white">
            <SkipForward className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    ),
    call: (
      <div className="flex w-[min(20rem,calc(100vw-4rem))] items-center gap-3 p-2 pl-3">
        <span className="size-9 shrink-0 rounded-full bg-gradient-to-br from-sky-300 to-blue-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Alibar</p>
          <p className="text-xs text-white/60">mobile</p>
        </div>
        <button type="button" aria-label="Decline" onClick={() => setView("idle")} className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-red-500">
          <PhoneOff className="size-4" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Accept" onClick={() => setView("timer")} className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-green-500">
          <Phone className="size-4" aria-hidden="true" />
        </button>
      </div>
    ),
  }[view];

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex h-36 w-full items-start justify-center">
        <DynamicIsland view={view} radius={view === "player" ? 32 : 28} role="status" aria-label={`Live activity: ${view}`}>
          {content}
        </DynamicIsland>
      </div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Activity">
        {(["idle", "timer", "music", "player", "call"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={pill}>
            {v === "player" ? "Expanded" : v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
