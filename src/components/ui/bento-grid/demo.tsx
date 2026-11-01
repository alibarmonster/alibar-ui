"use client";

import { BarChart3, Bell, Globe2, Lock, Sparkles } from "lucide-react";
import { BentoGrid, BentoTile } from "@/components/ui/bento-grid/bento-grid";

// Visuals animate with group-hover: (and group-focus-within:) classes from the tile.
const ease = "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

function Bars() {
  return (
    <div className="flex h-full items-end justify-center gap-2 px-8 pt-8">
      {[38, 62, 48, 80, 56, 92, 70].map((h, i) => (
        <span
          key={i}
          className={`w-5 origin-bottom rounded-t-[4px] bg-primary/80 ${ease} scale-y-[0.55] group-hover:scale-y-100 group-focus-within:scale-y-100`}
          style={{ height: `${h}%`, transitionDelay: `${i * 35}ms` }}
        />
      ))}
    </div>
  );
}

const OFFSETS = ["translate-x-2", "translate-x-4", "translate-x-6"];

function Notifications() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-5 pt-4">
      {["Payment received", "Build passed", "New signup"].map((text, i) => (
        <div
          key={text}
          className={`flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs whitespace-nowrap text-foreground shadow-xs ${ease} ${OFFSETS[i]} group-hover:translate-x-0 group-focus-within:translate-x-0`}
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <span className="size-1.5 rounded-full bg-success" />
          {text}
        </div>
      ))}
    </div>
  );
}

function Orbit() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <span className={`absolute size-28 rounded-full border border-dashed border-border ${ease} group-hover:rotate-90`} />
      <span className={`absolute size-18 rounded-full border border-border ${ease} group-hover:-rotate-45`} />
      <Globe2 className={`size-8 text-primary ${ease} group-hover:scale-110`} aria-hidden="true" />
    </div>
  );
}

export function Default() {
  return (
    <BentoGrid className="w-full max-w-4xl">
      <BentoTile headingLevel={2} className="sm:col-span-2" icon={<BarChart3 />} title="Analytics that explain themselves" description="Every chart has a table view, keyboard reading and a one-line summary." href="#analytics">
        <Bars />
      </BentoTile>
      <BentoTile headingLevel={2} icon={<Bell />} title="Calm notifications" description="Batched, ranked and never shouting." href="#notifications">
        <Notifications />
      </BentoTile>
      <BentoTile headingLevel={2} icon={<Globe2 />} title="Edge everywhere" description="Rendered close to every reader." href="#edge">
        <Orbit />
      </BentoTile>
      <BentoTile headingLevel={2} icon={<Lock />} title="Private by design" description="Your data stays in your region." />
      <BentoTile headingLevel={2} icon={<Sparkles />} title="Thoughtful AI" description="Suggestions you can always see the source of." href="#ai">
        <div className="flex h-full items-center justify-center">
          <span className={`rounded-full border border-border bg-background px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground shadow-xs ${ease} group-hover:-translate-y-1`}>
            Summarise this thread ↵
          </span>
        </div>
      </BentoTile>
    </BentoGrid>
  );
}
