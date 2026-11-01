"use client";

import { useRef } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal/scroll-reveal";

export function Default() {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div ref={scroller} tabIndex={0} aria-label="Article preview" className="relative h-80 w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {/* The section reads its progress from this scroll container instead of the page. The container is
          positioned (relative) so positions inside it are measured from its own top. */}
      <ScrollReveal container={scroller} className="space-y-10 px-6 pb-16">
        <header className="pt-8">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Field notes · 4 min read</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Designing motion people don’t notice</p>
        </header>
        <p className="text-sm leading-7 text-muted-foreground">
          The best interface motion is felt more than seen. It explains where something came from and where it went, then gets
          out of the way before anyone thinks about it.
        </p>
        <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-sky-200 via-indigo-200 to-fuchsia-200" />
        <p className="text-sm leading-7 text-muted-foreground">
          Start with layout: measure where things are, then animate only transforms and opacity between those positions. Springs
          beat fixed durations because they respond to interruption without a visible jump.
        </p>
        <dl className="grid grid-cols-3 gap-3">
          {[["60fps", "Target"], ["280ms", "Base duration"], ["0", "Layout shifts"]].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-border bg-surface p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm leading-7 text-muted-foreground">
          And respect the people who asked for less. With reduced motion on, every reveal here becomes a simple fade.
        </p>
      </ScrollReveal>
    </div>
  );
}
