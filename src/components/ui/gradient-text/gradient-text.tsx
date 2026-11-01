"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface GradientTextProps
  extends Omit<ComponentProps<"span">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Text to color. */
  children: ReactNode;
  /** Gradient stops, left to right. @default ["var(--primary)", "#7C3AED", "#DB2777"] */
  colors?: string[];
  /** Seconds for the wash to travel one full cycle. @default 8 */
  duration?: number;
  /** Hold the gradient still. It also holds still under reduced motion. @default false */
  paused?: boolean;
}

const DEFAULT_COLORS = ["var(--primary)", "#7C3AED", "#DB2777"];

export function GradientText({ children, colors = DEFAULT_COLORS, duration = 8, paused = false, className, style, ...props }: GradientTextProps) {
  const reduceMotion = useReducedMotion();
  const moving = !paused && !reduceMotion;
  // Two copies of the palette across a 200%-wide background: shifting by half its width loops seamlessly.
  const stops = [...colors, ...colors, colors[0]].join(", ");

  return (
    <motion.span
      className={cn(
        "bg-clip-text text-transparent [-webkit-background-clip:text] [box-decoration-break:clone]",
        "selection:text-foreground forced-colors:bg-none forced-colors:text-[CanvasText]",
        className,
      )}
      style={{ ...style, backgroundImage: `linear-gradient(90deg, ${stops})`, backgroundSize: "200% 100%" }}
      initial={{ backgroundPosition: "100% 50%" }}
      // background-position only repaints the glyphs; it never triggers layout.
      animate={moving ? { backgroundPosition: ["100% 50%", "0% 50%"] } : { backgroundPosition: "100% 50%" }}
      transition={moving ? { duration, ease: "linear", repeat: Infinity } : { duration: 0.6 }}
      {...props}
    >
      {children}
    </motion.span>
  );
}
