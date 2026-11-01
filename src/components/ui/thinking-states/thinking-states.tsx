"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { ShimmerText } from "@/components/ui/shimmer-text/shimmer-text";
import { SpinnerCheck } from "@/components/ui/spinner-check/spinner-check";

export interface ThinkingStatesProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Stage messages, in order, e.g. ["Reading the question", "Searching the docs"]. */
  stages: string[];
  /** Controlled stage index. Without it, stages advance on their own every `interval` ms and stop on the last. */
  index?: number;
  /** Milliseconds per stage when advancing on its own. @default 2000 */
  interval?: number;
  /** Finished: shows a check and `doneLabel`. @default false */
  done?: boolean;
  /** Text shown once done. @default "Done" */
  doneLabel?: string;
  /** Show elapsed seconds after the message. @default true */
  showElapsed?: boolean;
}

export function ThinkingStates({
  stages,
  index,
  interval = 2000,
  done = false,
  doneLabel = "Done",
  showElapsed = true,
  className,
  ...props
}: ThinkingStatesProps) {
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const current = Math.min(index ?? internal, Math.max(stages.length - 1, 0));
  const message = done ? doneLabel : (stages[current] ?? "");

  useEffect(() => {
    if (index !== undefined || done || internal >= stages.length - 1) return;
    const timer = window.setTimeout(() => setInternal((i) => i + 1), interval);
    return () => window.clearTimeout(timer);
  }, [index, done, internal, stages.length, interval]);

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [done]);

  return (
    <div role="status" className={cn("flex items-center gap-2.5 text-sm", className)} {...props}>
      <SpinnerCheck aria-hidden="true" role="presentation" status={done ? "success" : "loading"} size={16} className="text-muted-foreground" />
      <span className="sr-only">{message}</span>
      <span aria-hidden="true" className="relative grid min-w-0 *:[grid-area:1/1]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={message}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: duration.base, ease: ease.out }}
            className="truncate"
          >
            {done ? <span className="text-foreground">{message}</span> : <ShimmerText>{message}</ShimmerText>}
          </motion.span>
        </AnimatePresence>
      </span>
      {showElapsed ? (
        <span aria-hidden="true" className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {seconds}s
        </span>
      ) : null}
    </div>
  );
}
