"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface NumberTickerProps
  extends Omit<ComponentProps<"span">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** The number to count to. Changing it counts on from the number currently shown. */
  value: number;
  /** Where the first count starts. @default 0 */
  from?: number;
  /** Seconds the count takes. @default 1.4 */
  duration?: number;
  /** Seconds before the first count starts. @default 0 */
  delay?: number;
  /** Count once scrolled into view, or straight away. @default "inView" */
  trigger?: "inView" | "mount";
  /** Decimal places shown while counting. Defaults to the decimals in `value`. */
  decimals?: number;
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" }. */
  format?: Intl.NumberFormatOptions;
  /** Locale for formatting. @default "en-US" */
  locale?: string;
  /** Text before the number, e.g. "+". */
  prefix?: string;
  /** Text after the number, e.g. "k users". */
  suffix?: string;
}

export function NumberTicker({
  value,
  from = 0,
  duration = 1.4,
  delay = 0,
  trigger = "inView",
  decimals,
  format,
  locale = "en-US",
  prefix = "",
  suffix = "",
  className,
  ...props
}: NumberTickerProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const started = useRef(false);
  const places = decimals ?? (String(value).split(".")[1]?.length ?? 0);
  const formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: places, maximumFractionDigits: places, ...format });
  const count = useMotionValue(from);
  // Rendered straight into the DOM by Motion, so counting never re-renders React.
  const text = useTransform(count, (v) => `${prefix}${formatter.format(v)}${suffix}`);
  const final = `${prefix}${formatter.format(value)}${suffix}`;

  useEffect(() => {
    if (trigger === "inView" && !inView) return;
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const first = !started.current;
    started.current = true;
    const controls = animate(count, value, { duration, delay: first ? delay : 0, ease: ease.out });
    return () => controls.stop();
  }, [value, inView, trigger, reduceMotion, duration, delay, count]);

  return (
    <span className={cn("inline-grid", className)} {...props}>
      <span className="sr-only select-none">{final}</span>
      {/* The final value reserves the width, so counting never nudges the layout. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 select-none whitespace-nowrap">
        {final}
      </span>
      <motion.span ref={ref} aria-hidden="true" className="col-start-1 row-start-1 whitespace-nowrap">
        {text}
      </motion.span>
    </span>
  );
}
