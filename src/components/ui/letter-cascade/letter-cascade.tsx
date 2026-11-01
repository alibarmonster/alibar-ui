"use client";

import { useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, spring } from "@/lib/motion";

export interface LetterCascadeProps
  extends Omit<ComponentProps<"span">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Current text. When it changes, letters that differ drop out and their replacements drop in, one after another. */
  text: string;
  /** Seconds between letters. @default 0.035 */
  stagger?: number;
  /** Which way letters fall. @default "down" */
  direction?: "down" | "up";
  /** Cascade the letters in on first render too. @default true */
  animateOnMount?: boolean;
}

function graphemes(value: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

/** Changed positions get increasing delays in order; unchanged letters don't move. */
function cascadeDelays(from: string[], to: string[], stagger: number) {
  const delays: number[] = [];
  let k = 0;
  for (let i = 0; i < Math.max(from.length, to.length); i++) {
    delays.push(from[i] === to[i] ? 0 : k++ * stagger);
  }
  return delays;
}

export function LetterCascade({
  text,
  stagger = 0.035,
  direction = "down",
  animateOnMount = true,
  className,
  ...props
}: LetterCascadeProps) {
  const reduceMotion = useReducedMotion();
  const chars = graphemes(text);
  const [previous, setPrevious] = useState(text);
  const [delays, setDelays] = useState(() => chars.map((_, i) => i * stagger));
  const [generation, setGeneration] = useState(0);
  if (previous !== text) {
    setPrevious(text);
    setDelays(cascadeDelays(graphemes(previous), chars, stagger));
    setGeneration((g) => g + 1);
  }

  const fall = direction === "down" ? 1 : -1;
  const tilt = (i: number) => (i % 2 ? 10 : -10);

  const letter = (i: number): Variants => ({
    enter: reduceMotion ? { opacity: 0 } : { opacity: 0, y: `${-0.75 * fall}em`, rotate: tilt(i), filter: "blur(2px)" },
    center: (delay: number) => ({
      opacity: 1,
      y: 0,
      rotate: 0,
      filter: "blur(0px)",
      transition: reduceMotion ? { duration: duration.base, delay } : { ...spring.smooth, delay: delay + 0.05 },
    }),
    exit: (delay: number) => ({
      opacity: 0,
      ...(reduceMotion ? {} : { y: `${0.75 * fall}em`, rotate: -tilt(i), filter: "blur(2px)" }),
      transition: { duration: duration.base, ease: [0.55, 0, 1, 0.45], delay },
    }),
  });

  return (
    <span className={cn("inline-block whitespace-nowrap", className)} {...props}>
      <span className="sr-only select-none">{text}</span>
      {/* Inline-level letters (not flex items), so copied text comes out as one word. */}
      <span aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false} custom={delays}>
          {chars.map((char, i) => (
            <motion.span
              key={i}
              layout={reduceMotion ? false : "position"}
              transition={spring.smooth}
              className="relative inline-block"
              // A removed slot (the text got shorter) drops its letter like any other change.
              variants={{
                exit: (all: number[]) => ({
                  opacity: 0,
                  ...(reduceMotion ? {} : { y: `${0.75 * fall}em`, rotate: -tilt(i) }),
                  transition: { duration: duration.base, ease: [0.55, 0, 1, 0.45], delay: all[i] ?? 0 },
                }),
              }}
              exit="exit"
            >
              <AnimatePresence mode="popLayout" initial={animateOnMount || generation > 0} custom={delays[i] ?? 0}>
                <motion.span
                  key={char}
                  custom={delays[i] ?? 0}
                  variants={letter(i)}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  inherit={false}
                  className="inline-block whitespace-pre"
                >
                  {char === " " ? " " : char}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
}
