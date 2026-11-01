"use client";

import type { ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface RollingDigitsProps extends Omit<ComponentProps<"span">, "children"> {
  /** The number to show. Each digit rolls to its new value when this changes. */
  value: number;
  /** Decimal places. Defaults to the decimals in `value`. */
  decimals?: number;
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "EUR" }. */
  format?: Intl.NumberFormatOptions;
  /** Locale for formatting. @default "en-US" */
  locale?: string;
  /** Roll every digit up from zero on first render. @default true */
  animateOnMount?: boolean;
  /** Seconds between reels, starting from the rightmost digit. @default 0.035 */
  stagger?: number;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const REEL = { type: "spring", stiffness: 140, damping: 20, mass: 0.9 } as const;
// The reel fades out at its top and bottom edges, like a real odometer window.
const MASK = "linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)";

function Reel({ digit, delay, reduceMotion }: { digit: number; delay: number; reduceMotion: boolean }) {
  return (
    <span
      className="relative inline-block [clip-path:inset(0)]"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      {/* Sets the cell's width and baseline; tabular figures keep every digit the same width. */}
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        initial={{ y: "0%" }}
        animate={{ y: `${-digit * 10}%` }}
        transition={reduceMotion ? { duration: 0 } : { ...REEL, delay }}
      >
        {DIGITS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </motion.span>
    </span>
  );
}

export function RollingDigits({
  value,
  decimals,
  format,
  locale = "en-US",
  animateOnMount = true,
  stagger = 0.035,
  className,
  ...props
}: RollingDigitsProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const places = decimals ?? (String(value).split(".")[1]?.length ?? 0);
  const text = new Intl.NumberFormat(locale, { minimumFractionDigits: places, maximumFractionDigits: places, ...format }).format(value);
  const chars = Array.from(text);

  return (
    <span className={cn("inline-block whitespace-nowrap tabular-nums", className)} {...props}>
      <span className="sr-only">{text}</span>
      {/* Keyed by place value from the right, so the ones reel stays the ones reel as the number grows. */}
      <span aria-hidden="true" className="select-none">
        {/* With animateOnMount off, everything present on first render skips its entrance, reels included;
            digits that appear later (999 → 1,000) still roll up from zero. */}
        <AnimatePresence mode="popLayout" initial={animateOnMount}>
          {chars.map((char, i) => {
            const place = chars.length - i;
            const isDigit = /\d/.test(char);
            return (
              <motion.span
                key={isDigit ? `d${place}` : `s${place}${char}`}
                layout={reduceMotion ? false : "position"}
                className="inline-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: duration.quick } }}
                transition={{ duration: duration.base, layout: REEL }}
              >
                {isDigit ? (
                  <Reel digit={Number(char)} delay={(place - 1) * stagger} reduceMotion={reduceMotion} />
                ) : (
                  char
                )}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </span>
    </span>
  );
}
