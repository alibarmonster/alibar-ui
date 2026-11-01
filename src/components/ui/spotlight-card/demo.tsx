"use client";

import { Gauge, Layers, ShieldCheck } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card/spotlight-card";

const FEATURES = [
  { icon: Gauge, title: "Fast by default", body: "Only transforms and opacity animate, so every interaction stays at 60fps." },
  { icon: Layers, title: "Composable", body: "Small, single-file components you can read in a minute and change in two." },
  { icon: ShieldCheck, title: "Accessible", body: "Keyboard support, focus management and reduced-motion fallbacks built in." },
];

export function Default() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, body }) => (
        <SpotlightCard key={title} className="rounded-2xl border border-border bg-card p-5">
          <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <p className="mt-4 font-semibold tracking-tight text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
        </SpotlightCard>
      ))}
    </div>
  );
}

export function Dark() {
  return (
    <SpotlightCard
      className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6"
      color="rgb(99 102 241 / 0.25)"
      borderColor="rgb(165 180 252 / 0.9)"
      size={420}
    >
      <p className="text-xs font-medium tracking-wider text-indigo-300 uppercase">New</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-white">Realtime collaboration</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">See teammates’ cursors, selections and edits as they happen, with conflict-free merging.</p>
    </SpotlightCard>
  );
}
