"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type ElementType, type FocusEvent, type PointerEvent } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type TextScrambleTag = "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "strong" | "code";

export interface TextScrambleProps extends Omit<ComponentProps<"span">, "children"> {
  /** Text to reveal. Changing it scrambles from the current text to the new one. */
  text: string;
  /** Element to render. @default "span" */
  as?: TextScrambleTag;
  /** When to play: on mount, each time it's hovered or focused, or once it scrolls into view. @default "mount" */
  trigger?: "mount" | "hover" | "inView";
  /** Milliseconds until every character has resolved. @default 900 */
  duration?: number;
  /** Milliseconds between random-character swaps. @default 40 */
  tick?: number;
  /** Characters drawn at random while scrambling. @default "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?/<>" */
  characters?: string;
  /** Called when the last character resolves. */
  onComplete?: () => void;
}

const DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?/<>";
const INLINE_TAGS = new Set<TextScrambleTag>(["span", "strong", "code"]);
const SPACE = /^\s$/;

function graphemes(value: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

/** A deterministic scrambled first paint, so server and client render the same markup. */
function placeholder(value: string, pool: string) {
  return graphemes(value)
    .map((c, i) => (SPACE.test(c) ? c : pool[(i * 7 + 3) % pool.length]))
    .join("");
}

export function TextScramble({
  text,
  as = "span",
  trigger = "mount",
  duration = 900,
  tick = 40,
  characters = DEFAULT_CHARACTERS,
  onComplete,
  className,
  onPointerEnter,
  onFocus,
  ...props
}: TextScrambleProps) {
  const reduceMotion = useReducedMotion();
  const visualRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(visualRef, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(() => (trigger === "mount" ? placeholder(text, characters) : text));
  const shown = useRef(display);
  const frame = useRef(0);
  const running = useRef(false);
  const played = useRef<string | null>(null);
  const latest = useRef({ text, onComplete });
  useEffect(() => {
    latest.current = { text, onComplete };
  });

  /** Scramble from whatever is on screen to `to`. `fresh` scrambles every character from the start. */
  const play = useCallback(
    (to: string, fresh: boolean) => {
      cancelAnimationFrame(frame.current);
      const target = graphemes(to);
      const from = graphemes(shown.current);
      const length = Math.max(target.length, from.length);
      // Characters resolve roughly left to right, each with a little randomness.
      const slots = Array.from({ length }, (_, i) => {
        const order = length > 1 ? i / (length - 1) : 1;
        const start = fresh ? 0 : Math.random() * duration * 0.25;
        const end = Math.max(start + duration * 0.15, duration * (0.3 + 0.7 * order) * (0.85 + Math.random() * 0.15));
        return { from: from[i] ?? "", to: target[i] ?? "", start, end };
      });
      running.current = true;
      let begin = 0;
      let last = -Infinity;
      const step = (now: number) => {
        begin ||= now;
        const elapsed = now - begin;
        if (now - last >= tick) {
          last = now;
          let done = true;
          const next = slots
            .map((s) => {
              if (elapsed >= s.end) return s.to;
              done = false;
              if (elapsed < s.start) return s.from;
              if (SPACE.test(s.to) && (!s.from || SPACE.test(s.from))) return s.to;
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join("");
          shown.current = next;
          setDisplay(next);
          if (done) {
            running.current = false;
            latest.current.onComplete?.();
            return;
          }
        }
        frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    },
    [characters, duration, tick],
  );

  // Mount and text changes. Also resumes a scramble interrupted by an unmount/remount (e.g. Strict Mode).
  useEffect(() => {
    if (reduceMotion) {
      // No scramble: show the text as is (in a frame callback, so server and client markup still match).
      frame.current = requestAnimationFrame(() => {
        shown.current = text;
        setDisplay(text);
      });
      return () => cancelAnimationFrame(frame.current);
    }
    const first = played.current === null;
    const changed = played.current !== text;
    played.current = text;
    if (changed && !(first && trigger !== "mount")) play(text, first);
    else if (shown.current !== text) play(text, false);
    return () => {
      cancelAnimationFrame(frame.current);
      running.current = false;
    };
  }, [text, trigger, reduceMotion, play]);

  useEffect(() => {
    if (trigger === "inView" && inView && !reduceMotion) play(latest.current.text, true);
  }, [trigger, inView, reduceMotion, play]);

  const replay = () => {
    if (trigger === "hover" && !reduceMotion && !running.current) play(text, true);
  };

  const Tag = as as ElementType;
  return (
    <Tag
      className={cn(INLINE_TAGS.has(as) ? "inline-grid" : "grid", className)}
      onPointerEnter={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerEnter?.(event);
        replay();
      }}
      onFocus={(event: FocusEvent<HTMLSpanElement>) => {
        onFocus?.(event);
        replay();
      }}
      {...props}
    >
      <span className="sr-only select-none">{text}</span>
      {/* The final text reserves the space, so scrambled glyphs never reflow the layout. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 select-none whitespace-pre-wrap">
        {text}
      </span>
      <span ref={visualRef} aria-hidden="true" className="col-start-1 row-start-1 whitespace-pre-wrap">
        {display}
      </span>
    </Tag>
  );
}
