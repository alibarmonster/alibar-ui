"use client";

import { Plane } from "lucide-react";
import { FlipCard } from "@/components/ui/flip-card/flip-card";

/** A decorative, deterministic block pattern standing in for a scannable code. */
function CodePattern() {
  const cells = Array.from({ length: 121 }, (_, i) => ((i * 37 + (i % 7) * 11) % 5 < 2 ? 1 : 0));
  return (
    <div aria-hidden="true" className="grid size-28 grid-cols-11 gap-px rounded-md bg-white p-2">
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-zinc-900" : "bg-transparent"} />
      ))}
    </div>
  );
}

export function Default() {
  return (
    <FlipCard
      className="w-full max-w-80"
      front={
        <div className="flex aspect-[1.35] flex-col justify-between rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between text-xs font-medium tracking-wider text-white/75 uppercase">
            <span>Boarding pass</span>
            <span>Seat 14A</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-semibold tracking-tight">LIS</p>
              <p className="text-xs text-white/70">Lisbon · 08:40</p>
            </div>
            <Plane className="size-5 text-white/80" aria-hidden="true" />
            <div className="text-right">
              <p className="text-3xl font-semibold tracking-tight">KEF</p>
              <p className="text-xs text-white/70">Reykjavík · 11:55</p>
            </div>
          </div>
          <p className="text-xs text-white/70">Tap to show the code</p>
        </div>
      }
      back={
        <div className="flex aspect-[1.35] items-center gap-5 rounded-2xl bg-zinc-900 p-5 text-white shadow-lg">
          <CodePattern />
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-white/55">Passenger</dt>
              <dd className="font-medium">Ada Laurent</dd>
            </div>
            <div>
              <dt className="text-white/55">Gate</dt>
              <dd className="font-medium">B12 · closes 08:20</dd>
            </div>
            <div>
              <dt className="text-white/55">Flight</dt>
              <dd className="font-medium">AL 2041</dd>
            </div>
          </dl>
        </div>
      }
    />
  );
}

export function Vertical() {
  return (
    <FlipCard
      axis="x"
      className="w-full max-w-72"
      front={
        <div className="flex aspect-[1.6] flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-md">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Member</p>
          <div>
            <p className="text-xl font-semibold tracking-tight text-foreground">Studio Pass</p>
            <p className="text-sm text-muted-foreground">Valid through Dec 2026</p>
          </div>
        </div>
      }
      back={
        <div className="flex aspect-[1.6] flex-col justify-center rounded-2xl border border-border bg-surface p-5 shadow-md">
          <p className="text-sm text-muted-foreground">Includes</p>
          <p className="mt-1 text-sm font-medium text-foreground">Unlimited desks · 10 meeting hours · Guest passes</p>
        </div>
      }
    />
  );
}
