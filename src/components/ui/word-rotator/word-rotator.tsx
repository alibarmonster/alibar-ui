"use client";

import { useEffect, useRef, useState, type ComponentProps, type PointerEvent } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface WordRotatorProps
  extends Omit<ComponentProps<"span">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Words to cycle through. */
  words: string[];
  /** Milliseconds each word stays. @default 2400 */
  interval?: number;
  /** Controlled index of the visible word. */
  index?: number;
  /** Initial index when uncontrolled. @default 0 */
  defaultIndex?: number;
  /** Called with the next index when it's time to rotate. In controlled mode, update `index` yourself. */
  onIndexChange?: (index: number) => void;
  /** Stop rotating. Rotation also pauses while offscreen. @default false */
  paused?: boolean;
  /** Pause while the pointer is over the word. @default true */
  pauseOnHover?: boolean;
  /** Where words sit while the width animates. @default "start" */
  align?: "start" | "center" | "end";
}

const JUSTIFY = { start: "flex-start", center: "center", end: "flex-end" } as const;

export function WordRotator({
  words,
  interval = 2400,
  index,
  defaultIndex = 0,
  onIndexChange,
  paused = false,
  pauseOnHover = true,
  align = "start",
  className,
  onPointerEnter,
  onPointerLeave,
  ...props
}: WordRotatorProps) {
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState(defaultIndex);
  const [hovered, setHovered] = useState(false);
  const [widths, setWidths] = useState<number[]>([]);
  const measureRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(boxRef, { amount: 0.5 });
  const count = words.length;
  const current = count ? (((index ?? internal) % count) + count) % count : 0;
  const changeRef = useRef(onIndexChange);
  useEffect(() => {
    changeRef.current = onIndexChange;
  });

  // Every word's width, measured from hidden copies; re-measured when fonts load or the size changes.
  const wordsKey = words.join("\u0000");
  useEffect(() => {
    const box = measureRef.current;
    if (!box) return;
    const words = Array.from(box.children) as HTMLElement[];
    const measure = () => setWidths(words.map((el) => el.offsetWidth));
    // Observe each word: the zero-size box itself never resizes.
    const observer = new ResizeObserver(measure);
    for (const el of words) observer.observe(el);
    return () => observer.disconnect();
  }, [wordsKey]);

  useEffect(() => {
    if (paused || (pauseOnHover && hovered) || !inView || count < 2) return;
    const timer = window.setTimeout(() => {
      const next = (current + 1) % count;
      if (index === undefined) setInternal(next);
      changeRef.current?.(next);
    }, interval);
    return () => window.clearTimeout(timer);
  }, [current, count, interval, paused, pauseOnHover, hovered, inView, index]);

  const width = widths[current];
  const variants = {
    enter: reduceMotion ? { opacity: 0 } : { opacity: 0, y: "0.45em", filter: "blur(6px)" },
    center: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: duration.slow, ease: ease.out } },
    exit: reduceMotion
      ? { opacity: 0, transition: { duration: duration.quick } }
      : { opacity: 0, y: "-0.45em", filter: "blur(6px)", transition: { duration: duration.base, ease: ease.out } },
  };

  return (
    <span
      className={cn("inline-flex", className)}
      onPointerEnter={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerEnter?.(event);
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerLeave?.(event);
        setHovered(false);
      }}
      {...props}
    >
      <span className="sr-only select-none">{words.join(", ")}</span>
      {/* Width animates to the next word, so text after the rotator glides instead of jumping. */}
      <motion.span
        ref={boxRef}
        aria-hidden="true"
        className="relative inline-flex whitespace-nowrap"
        style={{ justifyContent: JUSTIFY[align], clipPath: "inset(-0.35em -0.02em)" }}
        initial={false}
        animate={width === undefined ? undefined : { width }}
        transition={reduceMotion ? { duration: 0 } : spring.smooth}
      >
        {/* Zero-size and clipped, so the longest word never adds layout or scroll overflow. */}
        <span ref={measureRef} className="pointer-events-none invisible absolute top-0 left-0 flex size-0 flex-col overflow-hidden">
          {words.map((word, i) => (
            <span key={i} className="w-max whitespace-nowrap">
              {word}
            </span>
          ))}
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={current} variants={variants} initial="enter" animate="center" exit="exit" className="inline-block">
            {words[current]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </span>
  );
}
