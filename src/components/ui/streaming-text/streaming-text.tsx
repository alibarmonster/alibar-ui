"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface StreamingTextProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Text received so far. Append to it as chunks arrive; only the new part animates. */
  text: string;
  /** More text is on the way: shows the caret and sets aria-busy. @default false */
  streaming?: boolean;
  /** Animate each new word or each new character. @default "word" */
  granularity?: "word" | "character";
  /** Seconds each new token takes to resolve. @default 0.5 */
  duration?: number;
  /** Starting blur in px for new tokens. @default 6 */
  blur?: number;
  /** Show a pulsing caret after the text while streaming. @default true */
  caret?: boolean;
}

function graphemes(value: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

function tokenize(text: string, granularity: "word" | "character") {
  return granularity === "word" ? (text.match(/\S+\s*|\s+/g) ?? []) : graphemes(text);
}

export function StreamingText({
  text,
  streaming = false,
  granularity = "word",
  duration = 0.5,
  blur = 6,
  caret = true,
  className,
  ...props
}: StreamingTextProps) {
  const reduceMotion = useReducedMotion();
  const tokens = tokenize(text, granularity);
  // Tokens that finished animating collapse into one plain text node, so long answers stay light.
  const [settled, setSettled] = useState(0);
  const [previous, setPrevious] = useState(text);
  if (previous !== text) {
    setPrevious(text);
    if (!text.startsWith(previous)) setSettled(0);
  }

  const arrivals = useRef<number[]>([]);
  const live = useRef({ streaming, lastText: text });
  useEffect(() => {
    const times = arrivals.current;
    if (!text.startsWith(live.current.lastText)) times.length = 0;
    live.current = { streaming, lastText: text };
    const now = performance.now();
    while (times.length > tokens.length) times.pop();
    while (times.length < tokens.length) times.push(now);
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      const times = arrivals.current;
      const now = performance.now();
      let done = 0;
      while (done < times.length && now - times[done] > duration * 1000 + 60) done++;
      // While streaming, the last token may still grow ("hel" → "hello"), so it never settles early.
      if (live.current.streaming) done = Math.min(done, times.length - 1);
      setSettled((s) => (done > s ? done : s));
    }, 250);
    return () => window.clearInterval(id);
  }, [duration]);

  const cut = Math.min(settled, tokens.length);
  const initial = reduceMotion ? { opacity: 0 } : { opacity: 0, filter: `blur(${blur}px)` };

  return (
    <div className={cn("whitespace-pre-wrap", className)} aria-busy={streaming || undefined} {...props}>
      {tokens.slice(0, cut).join("")}
      {tokens.slice(cut).map((token, j) => (
        <motion.span
          key={cut + j}
          initial={initial}
          animate={{ opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
          transition={{ duration: reduceMotion ? duration * 0.6 : duration, ease: ease.out }}
        >
          {token}
        </motion.span>
      ))}
      {streaming && caret ? (
        <motion.span
          aria-hidden="true"
          className="ml-0.5 inline-block size-[0.55em] rounded-full bg-current align-[0.05em]"
          animate={reduceMotion ? { opacity: [0.35, 1, 0.35] } : { opacity: [0.35, 1, 0.35], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}

export interface TextStreamOptions {
  /** Average words per second. @default 30 */
  wordsPerSecond?: number;
  /** Start streaming; flip to true later to begin. @default true */
  enabled?: boolean;
}

/** Replays `source` as if it were arriving from a model, in uneven chunks. Handy for prototypes and demos. */
export function useTextStream(source: string, { wordsPerSecond = 30, enabled = true }: TextStreamOptions = {}) {
  const [text, setText] = useState("");
  const [run, setRun] = useState(0);
  const [current, setCurrent] = useState(source);
  if (current !== source) {
    setCurrent(source);
    setText("");
  }

  useEffect(() => {
    if (!enabled) return;
    const words = source.match(/\S+\s*|\s+/g) ?? [];
    let shown = 0;
    let timer = 0;
    const push = () => {
      // Real streams arrive in uneven chunks of one to three words.
      const take = 1 + Math.floor(Math.random() * 3);
      shown = Math.min(words.length, shown + take);
      setText(words.slice(0, shown).join(""));
      if (shown < words.length) timer = window.setTimeout(push, (take / wordsPerSecond) * 1000 * (0.6 + Math.random() * 0.8));
    };
    timer = window.setTimeout(push, 250);
    return () => window.clearTimeout(timer);
  }, [source, wordsPerSecond, enabled, run]);

  return {
    text,
    streaming: enabled && text.length < source.length,
    /** Clear the text and stream it again. */
    restart: () => {
      setText("");
      setRun((n) => n + 1);
    },
  };
}
