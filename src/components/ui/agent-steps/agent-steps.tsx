"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ShimmerText } from "@/components/ui/shimmer-text/shimmer-text";
import { SpinnerCheck, type SpinnerStatus } from "@/components/ui/spinner-check/spinner-check";

export type AgentStepStatus = "pending" | "running" | "done" | "error";

export interface AgentStep {
  /** Stable identity. */
  id: string;
  /** What the step does, e.g. "Reading 4 files". */
  title: string;
  /** Detail under the title, e.g. a file name or result. */
  description?: ReactNode;
  /** Where the step is. */
  status: AgentStepStatus;
}

export interface AgentStepsProps
  extends Omit<ComponentProps<"ol">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Steps in order. */
  steps: AgentStep[];
}

const ICON: Record<AgentStepStatus, SpinnerStatus> = { pending: "idle", running: "loading", done: "success", error: "error" };
const SPOKEN: Record<AgentStepStatus, string> = { pending: "pending", running: "in progress", done: "completed", error: "failed" };

export function AgentSteps({ steps, className, "aria-label": ariaLabel = "Progress", ...props }: AgentStepsProps) {
  const reduceMotion = useReducedMotion();
  return (
    <ol aria-label={ariaLabel} className={cn("relative", className)} {...props}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.id} aria-current={step.status === "running" ? "step" : undefined} className="relative flex gap-3 pb-5 last:pb-0">
            {/* The connector to the next step fills in once this step is done. */}
            {!last ? (
              <span aria-hidden="true" className="absolute top-6 bottom-1 left-[9px] w-0.5 overflow-hidden rounded-full bg-border">
                <motion.span
                  className="block size-full origin-top bg-success"
                  initial={false}
                  animate={{ scaleY: step.status === "done" ? 1 : 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                />
              </span>
            ) : null}
            <SpinnerCheck aria-hidden="true" role="presentation" status={ICON[step.status]} size={20} className="mt-px text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "pending" && "text-muted-foreground/70",
                  step.status === "done" && "text-foreground",
                  step.status === "error" && "text-destructive",
                )}
              >
                {step.status === "running" ? <ShimmerText>{step.title}</ShimmerText> : step.title}
                <span className="sr-only">, {SPOKEN[step.status]}</span>
              </p>
              {step.description ? (
                <motion.div
                  initial={false}
                  animate={{ opacity: step.status === "pending" ? 0.6 : 1 }}
                  className="mt-0.5 text-xs leading-5 text-muted-foreground"
                >
                  {step.description}
                </motion.div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
