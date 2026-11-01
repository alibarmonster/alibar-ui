"use client";

import type { ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, spring } from "@/lib/motion";

export type SpinnerStatus = "idle" | "loading" | "success" | "error";

export interface SpinnerCheckProps
  extends Omit<ComponentProps<"span">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** What to show: a hollow ring, a spinner, a check, or a cross. */
  status: SpinnerStatus;
  /** Size in px. @default 20 */
  size?: number;
  /** Screen-reader text for each status. @default { idle: "Not started", loading: "Loading", success: "Done", error: "Failed" } */
  labels?: Partial<Record<SpinnerStatus, string>>;
}

const LABELS: Record<SpinnerStatus, string> = { idle: "Not started", loading: "Loading", success: "Done", error: "Failed" };

export function SpinnerCheck({ status, size = 20, labels, className, ...props }: SpinnerCheckProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...LABELS, ...labels }[status];
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: duration.quick } };
  const badge = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: reduceMotion ? 1 : 0.8, transition: { duration: duration.instant } },
    transition: reduceMotion ? { duration: duration.base } : spring.bouncy,
  };
  const draw = (delay: number) => ({
    initial: { pathLength: reduceMotion ? 1 : 0 },
    animate: { pathLength: 1 },
    transition: { duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : delay, ease: "easeOut" as const },
  });

  return (
    <span role="status" className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }} {...props}>
      <span className="sr-only">{text}</span>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" className="overflow-visible">
        <AnimatePresence initial={false}>
          {status === "idle" ? (
            <motion.circle key="idle" cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.35} strokeWidth={2} {...fade} />
          ) : null}
          {status === "loading" ? (
            <motion.g key="loading" {...fade}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.18} strokeWidth={2.4} />
              {/* A quarter arc that spins (pulses under reduced motion). It's a CSS animation, so it runs even when
                  the spinner is first rendered inside a presence that skips initial animations. */}
              <g className="origin-center animate-spin [transform-box:fill-box] motion-reduce:animate-pulse">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray="0.28 1" />
              </g>
            </motion.g>
          ) : null}
          {status === "success" ? (
            <motion.g key="success" {...badge}>
              <circle cx="12" cy="12" r="11" fill="var(--success)" />
              <motion.path d="M7.4 12.4l3.1 3.1 6.1-6.6" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" {...draw(0.12)} />
            </motion.g>
          ) : null}
          {status === "error" ? (
            <motion.g key="error" {...badge} animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: [0, -2.5, 2.5, -1.5, 1.5, 0] }}>
              <circle cx="12" cy="12" r="11" fill="var(--destructive)" />
              <motion.path d="M8.5 8.5l7 7" stroke="white" strokeWidth={2.4} strokeLinecap="round" {...draw(0.1)} />
              <motion.path d="M15.5 8.5l-7 7" stroke="white" strokeWidth={2.4} strokeLinecap="round" {...draw(0.22)} />
            </motion.g>
          ) : null}
        </AnimatePresence>
      </svg>
    </span>
  );
}
