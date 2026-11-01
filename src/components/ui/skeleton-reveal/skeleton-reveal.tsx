"use client";

import type { ComponentProps, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export type SkeletonProps = ComponentProps<"div">;

/** A pulsing placeholder block; size and round it with className. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} {...props} />;
}

export interface SkeletonRevealProps extends Omit<ComponentProps<"div">, "children"> {
  /** Show the skeleton instead of the content. */
  loading: boolean;
  /** Placeholder shown while loading; shape it like the content so nothing jumps. */
  skeleton: ReactNode;
  /** The real content. */
  children: ReactNode;
  /** Screen-reader text while loading. @default "Loading" */
  loadingLabel?: string;
}

export function SkeletonReveal({ loading, skeleton, children, loadingLabel = "Loading", className, ...props }: SkeletonRevealProps) {
  const reduceMotion = useReducedMotion();
  return (
    // Skeleton and content share one grid cell, so they cross-fade in place.
    <div aria-busy={loading || undefined} className={cn("grid *:[grid-area:1/1]", className)} {...props}>
      <span role="status" className="sr-only">
        {loading ? loadingLabel : ""}
      </span>
      <AnimatePresence initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: duration.base } }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(6px)", y: 4 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0, transitionEnd: { filter: "none" } }}
            exit={{ opacity: 0, transition: { duration: duration.quick } }}
            transition={{ duration: duration.slow, ease: ease.out, delay: reduceMotion ? 0 : 0.06 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
