"use client";

import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { PeelCard } from "@/components/ui/peel-card/peel-card";

export function Default() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <PeelCard
          rendering={rendering}
          onModeChange={onModeChange}
          front={
            <div className="flex h-48 flex-col justify-between rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#7c3aed)] p-5 text-white">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-80">Members only</p>
                <p className="mt-2 text-2xl font-semibold">Peel for your gift</p>
              </div>
              <p className="text-[12px] opacity-80">Drag the corner, or press it.</p>
            </div>
          }
          back={
            <div className="flex h-48 flex-col justify-between rounded-2xl border border-dashed border-border bg-background p-5">
              <div>
                <p className="text-[12px] text-muted-foreground">Your code</p>
                <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-foreground">KILN-25</p>
                <p className="mt-1 text-[13px] text-muted-foreground">25% off your next order, until Dec 31.</p>
              </div>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-[13px] font-medium text-primary underline underline-offset-4">
                Apply at checkout
              </a>
            </div>
          }
        />
      )}
    </HtmlCanvasDemo>
  );
}

export function Profile() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <PeelCard
          rendering={rendering}
          onModeChange={onModeChange}
          paperColor="#eef2ff"
          front={
            <div className="flex h-44 items-center gap-4 rounded-2xl border border-border bg-background p-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f59e0b,#ef4444)] text-lg font-semibold text-white">MO</span>
              <div>
                <p className="text-base font-semibold text-foreground">Mina Okafor</p>
                <p className="text-[13px] text-muted-foreground">Design lead · Lagos</p>
              </div>
            </div>
          }
          back={
            <div className="flex h-44 flex-col justify-center gap-2 rounded-2xl border border-border bg-surface p-5 text-[13px]">
              <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-foreground underline underline-offset-4">mina@studio.dev</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-foreground underline underline-offset-4">Portfolio</a>
              <p className="text-muted-foreground">Open to mentoring on Fridays.</p>
            </div>
          }
        />
      )}
    </HtmlCanvasDemo>
  );
}
