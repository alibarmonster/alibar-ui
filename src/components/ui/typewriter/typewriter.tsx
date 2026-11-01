"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface TypewriterProps extends Omit<ComponentProps<"span">, "children"> {
  /** Phrases to type, in order. */
  phrases: string[];
  /** Milliseconds per typed character; each keystroke varies a little so it feels human. @default 60 */
  typeSpeed?: number;
  /** Milliseconds per deleted character. @default 30 */
  deleteSpeed?: number;
  /** Milliseconds a finished phrase stays before it's deleted. @default 1600 */
  pause?: number;
  /** Milliseconds before the first keystroke. @default 400 */
  startDelay?: number;
  /** Cycle forever. When false, typing stops once the last phrase is typed. @default true */
  loop?: boolean;
  /** Stop typing. Typing also pauses on its own while offscreen. @default false */
  paused?: boolean;
  /** Show a blinking caret. @default true */
  caret?: boolean;
  /** Reserve the width of the longest phrase so surrounding text never shifts. @default false */
  reserveSpace?: boolean;
  /** Called each time a phrase has been fully typed. */
  onPhraseTyped?: (index: number) => void;
}

type Phase = "typing" | "holding" | "deleting" | "done";

function graphemes(value: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

export function Typewriter({
  phrases,
  typeSpeed = 60,
  deleteSpeed = 30,
  pause = 1600,
  startDelay = 400,
  loop = true,
  paused = false,
  caret = true,
  reserveSpace = false,
  onPhraseTyped,
  className,
  ...props
}: TypewriterProps) {
  const reduceMotion = useReducedMotion();
  const visualRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(visualRef, { amount: 0.2 });
  const [state, setState] = useState<{ index: number; length: number; phase: Phase; started: boolean }>({
    index: 0,
    length: 0,
    phase: "typing",
    started: false,
  });
  const typedRef = useRef(onPhraseTyped);
  useEffect(() => {
    typedRef.current = onPhraseTyped;
  });

  const count = phrases.length;
  const phrase = phrases[state.index % Math.max(count, 1)] ?? "";

  useEffect(() => {
    if (paused || !inView || count === 0 || state.phase === "done") return;
    const { index, length, phase, started } = state;
    const chars = graphemes(phrase);
    let wait = 0;
    let next = state;

    if (phase === "typing") {
      const full = chars.length;
      if (reduceMotion) {
        // Whole phrases appear at once and crossfade instead of being typed.
        wait = started ? 0 : startDelay;
        next = { index, length: full, phase: "holding", started: true };
      } else {
        const previous = chars[length - 1] ?? "";
        // Keystrokes vary ±40%, with a beat after punctuation.
        wait = !started ? startDelay : typeSpeed * (0.6 + Math.random() * 0.8) + (/[,.!?;:]/.test(previous) ? typeSpeed * 3 : 0);
        next = length + 1 >= full ? { index, length: full, phase: "holding", started: true } : { index, length: length + 1, phase, started: true };
      }
      if (next.phase === "holding" && !loop && index === count - 1) next = { ...next, phase: "done" };
    } else if (phase === "holding") {
      wait = pause;
      next = reduceMotion
        ? { index: (index + 1) % count, length: 0, phase: "typing", started }
        : { index, length, phase: "deleting", started };
    } else if (phase === "deleting") {
      wait = length > 0 ? deleteSpeed : typeSpeed * 4;
      next = length > 0 ? { index, length: length - 1, phase, started } : { index: (index + 1) % count, length: 0, phase: "typing", started };
    }

    const timer = window.setTimeout(() => {
      setState(next);
      if (next.phase !== phase && (next.phase === "holding" || next.phase === "done")) typedRef.current?.(index);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [state, phrase, count, paused, inView, reduceMotion, typeSpeed, deleteSpeed, pause, startDelay, loop]);

  const typed = graphemes(phrase).slice(0, state.length).join("");
  // The caret holds steady while keys are moving and blinks while waiting (never under reduced motion).
  const blinking = !reduceMotion && (state.phase === "holding" || state.phase === "done" || !state.started || paused);

  const caretMark = (
    <span aria-hidden="true" className="ml-[0.06em] inline-block h-[1em] w-[0.08em] min-w-[2px] rounded-[1px] align-[-0.12em]" />
  );

  return (
    <span className={cn("inline-grid", className)} {...props}>
      <span className="sr-only select-none">{phrases.join(", ")}</span>
      {reserveSpace
        ? phrases.map((phrase, i) => (
            <span key={i} aria-hidden="true" className="invisible col-start-1 row-start-1 select-none whitespace-pre">
              {phrase}
              {caret ? caretMark : null}
            </span>
          ))
        : null}
      <span ref={visualRef} aria-hidden="true" className="col-start-1 row-start-1 whitespace-pre-wrap">
        <motion.span
          key={reduceMotion ? state.index : "typed"}
          initial={reduceMotion ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.base }}
        >
          {typed}
        </motion.span>
        {caret ? (
          <motion.span
            key={blinking ? "blink" : "solid"}
            className="ml-[0.06em] inline-block h-[1em] w-[0.08em] min-w-[2px] rounded-[1px] bg-current align-[-0.12em]"
            initial={{ opacity: 1 }}
            animate={blinking ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
            transition={blinking ? { duration: 1.05, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: "linear" } : { duration: 0 }}
          />
        ) : null}
      </span>
    </span>
  );
}
