"use client";

import { useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface FlipCardProps
  extends Omit<ComponentProps<"button">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Front face. Keep it non-interactive: the whole card is the flip button. */
  front: ReactNode;
  /** Back face. */
  back: ReactNode;
  /** Controlled flipped state. */
  flipped?: boolean;
  /** Initial flipped state when uncontrolled. @default false */
  defaultFlipped?: boolean;
  /** Called when the card flips. */
  onFlippedChange?: (flipped: boolean) => void;
  /** Flip around the vertical axis (side to side) or the horizontal axis (top over bottom). @default "y" */
  axis?: "y" | "x";
}

const FLIP = { type: "spring", stiffness: 170, damping: 22, mass: 1 } as const;

export function FlipCard({
  front,
  back,
  flipped,
  defaultFlipped = false,
  onFlippedChange,
  axis = "y",
  className,
  onClick,
  ...props
}: FlipCardProps) {
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState(defaultFlipped);
  const isFlipped = flipped ?? internal;
  const rotate = axis === "y" ? "rotateY" : "rotateX";

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (flipped === undefined) setInternal(!isFlipped);
    onFlippedChange?.(!isFlipped);
  };

  // Each face hides its back; the back face starts turned away so the flip reveals it.
  const face = "col-start-1 row-start-1 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

  return (
    <button
      type="button"
      aria-pressed={isFlipped}
      onClick={toggle}
      className={cn(
        "relative block cursor-pointer rounded-2xl text-left outline-none [perspective:1400px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      {/* Switching variants replays every key, so the mid-turn dip in scale happens on each flip. */}
      <motion.span
        className="grid [transform-style:preserve-3d]"
        initial={false}
        variants={{
          front: { [rotate]: 0, scale: [1, 0.94, 1] },
          back: { [rotate]: 180, scale: [1, 0.94, 1] },
        }}
        animate={reduceMotion ? undefined : isFlipped ? "back" : "front"}
        transition={{ ...FLIP, scale: { duration: 0.55, times: [0, 0.5, 1], ease: "easeInOut" } }}
      >
        <motion.span
          className={cn(face, "block")}
          aria-hidden={isFlipped}
          initial={false}
          animate={reduceMotion ? { opacity: isFlipped ? 0 : 1 } : undefined}
          transition={{ duration: duration.base }}
        >
          {front}
        </motion.span>
        {/* The back starts turned away. Its rotation is a Motion value rather than a class, so server markup
            never depends on the reduced-motion setting; with reduced motion it faces front and crossfades. */}
        <motion.span
          className={cn(face, "block")}
          aria-hidden={!isFlipped}
          initial={false}
          animate={reduceMotion ? { [rotate]: 0, opacity: isFlipped ? 1 : 0 } : { [rotate]: 180, opacity: 1 }}
          transition={{ duration: duration.base, [rotate]: { duration: 0 } }}
        >
          {back}
        </motion.span>
      </motion.span>
      <span className="sr-only">{isFlipped ? ", showing the back. Press to show the front." : ". Press to show the back."}</span>
    </button>
  );
}
