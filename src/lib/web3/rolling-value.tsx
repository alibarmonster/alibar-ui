"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const REEL = { type: "spring", stiffness: 160, damping: 22, mass: 0.9 } as const;
const MASK = "linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)";

function Reel({ digit, reduceMotion }: { digit: number; reduceMotion: boolean }) {
  return (
    <span className="relative inline-block [clip-path:inset(0)]" style={{ maskImage: MASK, WebkitMaskImage: MASK }}>
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={reduceMotion ? { duration: 0 } : REEL}
      >
        {DIGITS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </motion.span>
    </span>
  );
}

export interface RollingValueProps {
  /** Pre-formatted text, e.g. "$1,234.56" or "2.4815". Digits roll; everything else stays put. */
  value: string;
  /**
   * The raw value behind the text (a bigint amount or a number). When it changes, the text
   * flashes green for an increase and red for a decrease.
   */
  trend?: bigint | number;
  /** Flash on increases and decreases. @default true */
  flash?: boolean;
  className?: string;
}

type Flash = { direction: "up" | "down"; key: number };

/**
 * Rolling digits for pre-formatted strings, so bigint amounts animate without ever becoming
 * floats. Uses tabular figures; screen readers get the plain text.
 */
export function RollingValue({ value, trend, flash = true, className }: RollingValueProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [previous, setPrevious] = useState(trend);
  const [pulse, setPulse] = useState<Flash | null>(null);

  if (trend !== previous) {
    setPrevious(trend);
    if (flash && trend !== undefined && previous !== undefined) {
      setPulse({ direction: trend > previous ? "up" : "down", key: (pulse?.key ?? 0) + 1 });
    }
  }

  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(() => setPulse(null), 900);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  // Key characters by their distance from the end, so a given place value keeps its reel.
  const chars = [...value];
  return (
    <span
      className={cn(
        "relative inline-flex tabular-nums transition-colors duration-300",
        pulse?.direction === "up" && "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]",
        pulse?.direction === "down" && "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]",
        className,
      )}
    >
      <span className="sr-only">{value}</span>
      <AnimatePresence>
        {pulse && !reduceMotion ? (
          <motion.span
            key={pulse.key}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -inset-x-1 inset-y-0 rounded-[4px]",
              pulse.direction === "up" ? "bg-success/12" : "bg-destructive/12",
            )}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>
      <span aria-hidden="true" className="relative inline-flex select-none">
        {chars.map((char, index) => {
          const key = chars.length - index;
          return /\d/.test(char) ? <Reel key={key} digit={Number(char)} reduceMotion={reduceMotion} /> : <span key={`${key}${char}`}>{char}</span>;
        })}
      </span>
    </span>
  );
}
