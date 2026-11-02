"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface IconSlot {
  /** Icons that take turns in this slot, e.g. app icons. Decorative. */
  icons: ReactNode[];
  /** Background behind each icon, by index (falls back to the first). */
  backgrounds?: string[];
}

export interface IconHeadlineProps {
  /** Words and icon slots in order, e.g. ["Where", { icons: [...] }, "teams and agents"]. */
  parts: (string | IconSlot)[];
  /** Heading element. @default "h1" */
  as?: ElementType;
  /** Milliseconds between icon swaps; 0 keeps the first icon. @default 2600 */
  interval?: number;
  /** Seconds before the entrance starts. @default 0 */
  delay?: number;
  /** Classes for the heading. */
  className?: string;
}

const tileShadow = "0 0.04em 0.12em rgb(0 0 0 / 0.18), inset 0 0 0 0.012em rgb(0 0 0 / 0.06)";

function Slot({ slot, order, tick, reduceMotion, delay }: { slot: IconSlot; order: number; tick: number; reduceMotion: boolean; delay: number }) {
  const index = slot.icons.length ? tick % slot.icons.length : 0;
  const background = slot.backgrounds?.[index] ?? slot.backgrounds?.[0] ?? "#f4f4f5";
  return (
    <motion.span
      aria-hidden="true"
      className="relative mx-[0.1em] inline-grid size-[0.86em] -translate-y-[0.06em] place-items-center overflow-hidden rounded-[22%] align-middle [perspective:200px]"
      style={{ boxShadow: tileShadow }}
      initial={reduceMotion ? { opacity: 0 } : { scale: 0, rotate: -18, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1, backgroundColor: background }}
      transition={reduceMotion ? { duration: 0.2, delay } : { type: "spring", stiffness: 420, damping: 16, delay: delay + 0.25 + order * 0.12, backgroundColor: { duration: 0.35 } }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={index}
          className="grid size-full place-items-center"
          initial={reduceMotion ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.38, ease: ease.out, delay: reduceMotion ? 0 : order * 0.08 }}
        >
          {slot.icons[index]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

/**
 * A big headline with app-icon tiles set inline between its words. Words rise in, the tiles pop into
 * place one after another, then each slot flips to its next icon on an interval. The icons are
 * decorative; screen readers hear the words only.
 */
export function IconHeadline({ parts, as: Tag = "h1", interval = 2600, delay = 0, className }: IconHeadlineProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [tick, setTick] = useState(0);
  const cycling = interval > 0 && !reduceMotion && parts.some((p) => typeof p !== "string" && p.icons.length > 1);

  useEffect(() => {
    if (!cycling) return;
    let timer = 0;
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        if (!document.hidden) setTick((t) => t + 1);
      }, interval);
    }, delay * 1000 + 1200);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [cycling, interval, delay]);

  let wordIndex = 0;
  let slotIndex = 0;
  const label = parts.filter((p): p is string => typeof p === "string").join(" ");

  return (
    <Tag aria-label={label} className={cn("text-balance text-[clamp(2.25rem,7vw,4.5rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-foreground", className)}>
      {parts.map((part, i) => {
        if (typeof part !== "string") {
          const order = slotIndex++;
          return <Slot key={`slot-${i}`} slot={part} order={order} tick={tick} reduceMotion={reduceMotion} delay={delay} />;
        }
        return (
          <span key={`text-${i}`} aria-hidden="true">
            {part.split(/(\s+)/).map((word, j) => {
              if (/^\s+$/.test(word) || !word) return word;
              const order = wordIndex++;
              return (
                <motion.span
                  key={j}
                  className="inline-block"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "0.3em", filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: ease.out, delay: delay + order * 0.05 }}
                >
                  {word}
                </motion.span>
              );
            })}{" "}
          </span>
        );
      })}
    </Tag>
  );
}
