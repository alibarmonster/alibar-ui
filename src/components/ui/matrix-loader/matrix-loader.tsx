"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type MatrixPattern = "wave" | "diagonal" | "spiral" | "pulse" | "rain";

export interface MatrixLoaderProps
  extends Omit<ComponentProps<"span">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** The order in which dots light up. @default "wave" */
  pattern?: MatrixPattern;
  /** Dot size in px. @default 5 */
  dotSize?: number;
  /** Space between dots in px. @default 3 */
  gap?: number;
  /** Seconds for one full cycle. @default 1.4 */
  cycle?: number;
  /** Accessible label. @default "Loading" */
  label?: string;
}

// Clockwise spiral from the top-left corner inward.
const SPIRAL = [0, 1, 2, 3, 11, 12, 13, 4, 10, 15, 14, 5, 9, 8, 7, 6];
const RAIN = [2, 0, 3, 1];

/** Each dot's position in the sequence, from 0 to 1. */
function order(pattern: MatrixPattern, r: number, c: number) {
  switch (pattern) {
    case "diagonal":
      return (r + c) / 6;
    case "spiral":
      return SPIRAL[r * 4 + c] / 15;
    case "pulse":
      return Math.max(Math.abs(r - 1.5), Math.abs(c - 1.5)) > 1 ? 1 : 0;
    case "rain":
      return ((r + RAIN[c]) % 4) / 3;
    default:
      return c / 3;
  }
}

export function MatrixLoader({ pattern = "wave", dotSize = 5, gap = 3, cycle = 1.4, label = "Loading", className, ...props }: MatrixLoaderProps) {
  const reduceMotion = useReducedMotion();
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-grid grid-cols-4", className)}
      style={{ gap, gridTemplateColumns: `repeat(4, ${dotSize}px)` }}
      {...props}
    >
      {Array.from({ length: 16 }, (_, i) => {
        const delay = order(pattern, Math.floor(i / 4), i % 4) * cycle * 0.55;
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            className="block rounded-full bg-current"
            style={{ width: dotSize, height: dotSize }}
            initial={{ opacity: 0.15, scale: reduceMotion ? 1 : 0.7 }}
            animate={reduceMotion ? { opacity: [0.2, 0.75, 0.2] } : { opacity: [0.15, 1, 0.15], scale: [0.7, 1, 0.7] }}
            transition={{ duration: reduceMotion ? cycle * 1.6 : cycle, delay, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </span>
  );
}
