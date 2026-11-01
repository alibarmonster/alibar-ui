"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface BarsLoaderProps
  extends Omit<ComponentProps<"span">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Number of bars. @default 5 */
  bars?: number;
  /** Height in px. @default 20 */
  height?: number;
  /** Bar width in px. @default 3 */
  barWidth?: number;
  /** Space between bars in px. @default 2 */
  gap?: number;
  /** Bounce; when false the bars settle low, like paused audio. @default true */
  playing?: boolean;
  /** Speed multiplier. @default 1 */
  speed?: number;
  /** Accessible label. @default "Loading" */
  label?: string;
}

// Hand-tuned so neighboring bars never move in lockstep.
const PATTERNS = [
  [0.35, 1, 0.5, 0.85, 0.35],
  [0.6, 0.3, 1, 0.45, 0.6],
  [0.45, 0.9, 0.35, 1, 0.45],
  [0.8, 0.4, 0.7, 0.3, 0.8],
  [0.3, 0.75, 0.95, 0.5, 0.3],
];

export function BarsLoader({
  bars = 5,
  height = 20,
  barWidth = 3,
  gap = 2,
  playing = true,
  speed = 1,
  label = "Loading",
  className,
  ...props
}: BarsLoaderProps) {
  const reduceMotion = useReducedMotion();
  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-end", className)} style={{ height, gap }} {...props}>
      {Array.from({ length: bars }, (_, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="block h-full origin-bottom rounded-full bg-current"
          style={{ width: barWidth }}
          initial={{ scaleY: 0.3 }}
          animate={
            !playing
              ? { scaleY: 0.25, opacity: 1 }
              : reduceMotion
                ? { scaleY: 0.55, opacity: [1, 0.4, 1] }
                : { scaleY: PATTERNS[i % PATTERNS.length], opacity: 1 }
          }
          transition={
            !playing
              ? { duration: 0.4, ease: "easeOut" }
              : { duration: (reduceMotion ? 1.6 : 0.9 + (i % 3) * 0.17) / speed, delay: i * 0.08, repeat: Infinity, ease: "easeInOut" }
          }
        />
      ))}
    </span>
  );
}
