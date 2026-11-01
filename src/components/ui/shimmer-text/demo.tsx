"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ShimmerText } from "@/components/ui/shimmer-text/shimmer-text";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

export function Default() {
  return (
    <div className="flex flex-col items-center gap-5">
      <ShimmerText className="text-2xl font-semibold tracking-tight sm:text-3xl">Generating your report</ShimmerText>
      <ShimmerText className="text-sm">Thinking…</ShimmerText>
    </div>
  );
}

const STEPS = ["Reading 4 files", "Searching the docs", "Drafting a fix", "Running the tests"];

export function AgentSteps() {
  const [active, setActive] = useState(1);
  const finished = active >= STEPS.length;
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <ol className="space-y-2.5 text-sm" aria-label="Agent progress">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2.5" aria-current={i === active ? "step" : undefined}>
            <span
              aria-hidden="true"
              className={
                i < active
                  ? "flex size-4 items-center justify-center rounded-full bg-foreground text-background"
                  : i === active
                    ? "size-4 rounded-full border-2 border-primary/30 border-t-primary motion-safe:animate-spin"
                    : "size-4 rounded-full border border-border"
              }
            >
              {i < active ? <Check className="size-2.5" strokeWidth={3} /> : null}
            </span>
            {i === active ? (
              <ShimmerText>{step}</ShimmerText>
            ) : (
              <span className={i < active ? "text-foreground" : "text-muted-foreground/60"}>{step}</span>
            )}
          </li>
        ))}
      </ol>
      <button type="button" className={`${control} self-start`} onClick={() => setActive((a) => (finished ? 0 : a + 1))}>
        {finished ? "Run again" : "Next step"}
      </button>
    </div>
  );
}

export function CustomColors() {
  return (
    <div className="flex flex-col items-center gap-4">
      <ShimmerText className="text-xl font-semibold tracking-tight text-primary/45" highlightClassName="text-primary" duration={2.2}>
        Syncing 1,204 records
      </ShimmerText>
      <div className="rounded-full bg-foreground px-4 py-2">
        <ShimmerText className="text-sm font-medium text-background/45" highlightClassName="text-background">
          Listening…
        </ShimmerText>
      </div>
    </div>
  );
}
