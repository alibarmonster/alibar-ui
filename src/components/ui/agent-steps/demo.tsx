"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { AgentSteps, type AgentStep } from "@/components/ui/agent-steps/agent-steps";

const PLAN = [
  { id: "read", title: "Reading the issue", description: "#482 · Checkout rounds totals down" },
  { id: "search", title: "Searching the codebase", description: "Found 3 matches in cart/ and pricing/" },
  { id: "fix", title: "Writing a fix", description: "pricing/total.ts · round half up to the cent" },
  { id: "test", title: "Running the tests", description: "214 passed" },
  { id: "pr", title: "Opening a pull request", description: "Ready for review" },
];

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

/** Advances one step at a time; `failAt` makes that step fail instead. */
function useRun(failAt?: number) {
  const [at, setAt] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (at >= PLAN.length || at === failAt) return;
    const timer = window.setTimeout(() => setAt((a) => a + 1), 1500);
    return () => window.clearTimeout(timer);
  }, [at, run, failAt]);
  const steps: AgentStep[] = PLAN.map((step, i) => ({
    ...step,
    status: i < at ? "done" : i === at ? (i === failAt ? "error" : "running") : "pending",
    description: i <= at ? (i === failAt && i === at ? "3 tests failed · see the log" : step.description) : undefined,
  }));
  return { steps, restart: () => { setAt(0); setRun((r) => r + 1); } };
}

export function Default() {
  const { steps, restart } = useRun();
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <AgentSteps steps={steps} aria-label="Agent progress" />
      <button type="button" className={`${control} self-start`} onClick={restart}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Run again
      </button>
    </div>
  );
}

export function WithFailure() {
  const { steps, restart } = useRun(3);
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <AgentSteps steps={steps} aria-label="Agent progress" />
      <button type="button" className={`${control} self-start`} onClick={restart}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}
