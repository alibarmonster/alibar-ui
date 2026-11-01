"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/** A dot that travels a track with the given transition each time you press play. */
export function MotionSample({
  label,
  detail,
  transition,
  curve,
}: {
  label: string;
  detail: string;
  transition: Transition;
  /** Cubic-bezier control points to plot, if any. */
  curve?: readonly [number, number, number, number];
}) {
  const [end, setEnd] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3 sm:w-52">
        {curve ? (
          <svg viewBox="-6 -6 112 112" className="size-11 shrink-0 rounded-md border border-border bg-surface" aria-hidden="true">
            <path d="M0 100 L100 0" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
            <path
              d={`M0 100 C${curve[0] * 100} ${100 - curve[1] * 100} ${curve[2] * 100} ${100 - curve[3] * 100} 100 0`}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
        <div className="min-w-0">
          <p className="font-mono text-[13px] font-medium text-foreground">{label}</p>
          <p className="font-mono text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-3">
        <div className="relative h-9 flex-1 rounded-full bg-surface-2" aria-hidden="true">
          {/* The wrapper spans the travel distance, so x: 100% moves the dot end to end. */}
          <div className="absolute inset-y-0 right-[calc(0.375rem+1.5rem)] left-1.5">
            <motion.div className="h-full w-full" animate={{ x: end ? "100%" : "0%" }} transition={transition}>
              <span className="absolute top-1.5 left-0 size-6 rounded-full bg-foreground shadow-md" />
            </motion.div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEnd((value) => !value)}
          aria-label={`Play ${label}`}
          className="focus-ring inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-background text-foreground shadow-xs transition-[transform,background-color] hover:bg-surface active:scale-95"
        >
          <Play className={cn("size-4", reduceMotion && "opacity-60")} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
