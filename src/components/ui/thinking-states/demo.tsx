"use client";

import { useEffect, useState } from "react";
import { ThinkingStates } from "@/components/ui/thinking-states/thinking-states";

const STAGES = ["Reading your question", "Searching 1,284 documents", "Comparing three sources", "Writing the answer"];
const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40";

export function Default() {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), STAGES.length * 1800 + 600);
    return () => window.clearTimeout(timer);
  }, [run]);
  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-5">
      <ThinkingStates key={run} stages={STAGES} interval={1800} done={done} doneLabel="Answered" className="w-full" />
      <button type="button" className={control} onClick={() => { setDone(false); setRun((r) => r + 1); }} disabled={!done}>
        Ask again
      </button>
    </div>
  );
}

export function Controlled() {
  const [index, setIndex] = useState(0);
  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-5">
      <ThinkingStates stages={STAGES} index={index} showElapsed={false} className="w-full" />
      <div className="flex gap-2">
        <button type="button" className={control} onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          Back
        </button>
        <button type="button" className={control} onClick={() => setIndex((i) => Math.min(STAGES.length - 1, i + 1))} disabled={index === STAGES.length - 1}>
          Next stage
        </button>
      </div>
    </div>
  );
}
