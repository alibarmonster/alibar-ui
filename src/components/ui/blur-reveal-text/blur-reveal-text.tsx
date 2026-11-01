"use client";

import { useRef, type ComponentProps, type ElementType } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { duration, ease } from "@/lib/motion";

export type BlurRevealTag = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "blockquote";

export interface BlurRevealTextProps extends Omit<ComponentProps<"p">, "children"> {
  /** Text to reveal. */
  text: string;
  /** Element to render. @default "p" */
  as?: BlurRevealTag;
  /** Reveal word by word or letter by letter. @default "word" */
  by?: "word" | "character";
  /** Seconds between words (or letters). Long text is sped up so the whole reveal stays under ~1.6s. @default 0.045 words, 0.018 letters */
  stagger?: number;
  /** Seconds before the first word starts. @default 0 */
  delay?: number;
  /** Starting blur in px. @default 10 */
  blur?: number;
  /** Starting vertical offset in px. @default 8 */
  offset?: number;
  /** Reveal once scrolled into view, or straight away. @default "inView" */
  trigger?: "inView" | "mount";
  /** Reveal only the first time it enters the viewport. @default true */
  once?: boolean;
  /** Fraction of the text that must be visible to start. @default 0.4 */
  amount?: number;
}

type Piece = { kind: "space"; value: string } | { kind: "word"; chars: string[]; index: number };

function graphemes(value: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

/** Words (or letters) with a running index for the stagger; whitespace stays plain text so lines wrap naturally. */
function split(text: string, by: "word" | "character") {
  const pieces: Piece[] = [];
  let index = 0;
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if (/^\s+$/.test(token)) {
      pieces.push({ kind: "space", value: token });
    } else {
      const chars = by === "word" ? [token] : graphemes(token);
      pieces.push({ kind: "word", chars, index });
      index += chars.length;
    }
  }
  return { pieces, count: index };
}

export function BlurRevealText({
  text,
  as = "p",
  by = "word",
  stagger,
  delay = 0,
  blur = 10,
  offset = 8,
  trigger = "inView",
  once = true,
  amount = 0.4,
  ...props
}: BlurRevealTextProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, amount });
  const shown = trigger === "mount" || inView;
  const { pieces, count } = split(text, by);
  const step = Math.min(stagger ?? (by === "word" ? 0.045 : 0.018), 1.6 / Math.max(count, 1)) * (reduceMotion ? 0.5 : 1);

  const variants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: offset, filter: `blur(${blur}px)` },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { delay: delay + i * step, duration: reduceMotion ? duration.base : duration.slow + 0.15, ease: ease.out },
      // Drop the filter once settled so finished words cost nothing to paint.
      transitionEnd: { filter: "none" },
    }),
  };
  const state = shown ? "visible" : "hidden";
  const Tag = as as ElementType;

  return (
    <Tag {...props}>
      <span className="sr-only select-none">{text}</span>
      <span ref={ref} aria-hidden="true">
        {pieces.map((piece, p) =>
          piece.kind === "space" ? (
            piece.value
          ) : by === "word" ? (
            <motion.span key={p} custom={piece.index} variants={variants} initial="hidden" animate={state} className="inline-block">
              {piece.chars[0]}
            </motion.span>
          ) : (
            <span key={p} className="inline-block whitespace-nowrap">
              {piece.chars.map((char, c) => (
                <motion.span key={c} custom={piece.index + c} variants={variants} initial="hidden" animate={state} className="inline-block">
                  {char}
                </motion.span>
              ))}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
