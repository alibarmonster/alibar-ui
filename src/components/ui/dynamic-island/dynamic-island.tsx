"use client";

import type { ComponentProps, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface DynamicIslandProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Key of the current activity. Changing it morphs the island to fit the new content. @default "idle" */
  view?: string;
  /** Content of the current activity. Omit it for the idle pill. */
  children?: ReactNode;
  /** Corner radius in px for tall, expanded activities. Short ones always render as a pill. @default 28 */
  radius?: number;
}

// A slightly underdamped spring gives the island its characteristic "gooey" settle.
const MORPH = { type: "spring", stiffness: 400, damping: 30, mass: 0.9 } as const;

export function DynamicIsland({ view = "idle", children, radius = 28, className, ...props }: DynamicIslandProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : MORPH;

  return (
    <motion.div
      layout
      transition={transition}
      style={{ borderRadius: radius }}
      className={cn(
        "relative mx-auto flex min-h-9 min-w-[7.5rem] items-center justify-center overflow-hidden bg-zinc-950 text-white shadow-[0_8px_30px_rgb(0_0_0/0.18)]",
        className,
      )}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={view}
          layout="position"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: duration.instant } }
              : { opacity: 0, scale: 0.92, filter: "blur(6px)", transition: { duration: duration.quick } }
          }
          transition={{ duration: duration.base, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : 0.04, layout: transition }}
          className="w-full"
        >
          {children ?? <span aria-hidden="true" className="block h-9 w-[7.5rem]" />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
