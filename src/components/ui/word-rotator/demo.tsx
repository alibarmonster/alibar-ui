"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WordRotator } from "@/components/ui/word-rotator/word-rotator";

export function Default() {
  return (
    <p className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
      Design systems for <WordRotator words={["startups", "agencies", "enterprise", "everyone"]} className="text-primary" />
    </p>
  );
}

export function Pill() {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
      Ship
      <WordRotator
        words={["faster", "safer", "together", "on Fridays"]}
        align="center"
        interval={2000}
        className="rounded-full bg-primary/10 px-4 py-1 text-primary"
      />
      every week.
    </p>
  );
}

const control =
  "inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground shadow-xs transition-colors hover:bg-accent";

const FLAVORS = ["Vanilla", "Pistachio", "Salted caramel", "Mint"];

export function Controlled() {
  const [index, setIndex] = useState(0);
  const go = (step: number) => setIndex((i) => (i + step + FLAVORS.length) % FLAVORS.length);
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        Today’s scoop: <WordRotator words={FLAVORS} index={index} paused className="font-semibold" />
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={control} onClick={() => go(-1)} aria-label="Previous flavor">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="w-12 text-center text-[13px] text-muted-foreground tabular-nums">
          {index + 1} / {FLAVORS.length}
        </span>
        <button type="button" className={control} onClick={() => go(1)} aria-label="Next flavor">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
