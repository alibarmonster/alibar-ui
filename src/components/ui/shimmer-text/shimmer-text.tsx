"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface ShimmerTextProps extends Omit<ComponentProps<"span">, "children"> {
  /** One line of text. */
  children: ReactNode;
  /** Seconds for one sweep across the text. @default 1.6 */
  duration?: number;
  /** Seconds between sweeps. @default 0.4 */
  repeatDelay?: number;
  /** Width of the highlight band in px. Defaults to 40% of the text width, kept between 40 and 140px. */
  spread?: number;
  /** Run the sweep. When false, the text renders plainly in the base color. @default true */
  active?: boolean;
  /** Classes for the highlight band's text color. @default "text-foreground" */
  highlightClassName?: string;
}

const MASK = "linear-gradient(90deg, transparent, #000 50%, transparent)";

export function ShimmerText({
  children,
  duration = 1.6,
  repeatDelay = 0.4,
  spread,
  active = true,
  highlightClassName,
  className,
  ...props
}: ShimmerTextProps) {
  const reduceMotion = useReducedMotion();
  const lineRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);
  // A narrow window slides across while the copy inside slides back the same amount:
  // the highlighted text stays put and only transforms animate, never background-position.
  const x = useMotionValue(0);
  const counterX = useTransform(x, (v) => -v);
  const band = spread ?? Math.min(140, Math.max(40, width * 0.4));
  const sweeping = active && !reduceMotion && width > 0;

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    const observer = new ResizeObserver(() => setWidth(line.offsetWidth));
    observer.observe(line);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!sweeping) return;
    const controls = animate(x, [-band, width], { duration, ease: ease.inOut, repeat: Infinity, repeatDelay });
    return () => controls.stop();
  }, [sweeping, band, width, duration, repeatDelay, x]);

  return (
    <span className={cn("inline-block text-muted-foreground", className)} {...props}>
      <span ref={lineRef} className="relative inline-block whitespace-nowrap">
        {/* Reduced motion swaps the sweep for a gentle breathing fade. */}
        <motion.span
          className="inline-block"
          animate={active && reduceMotion ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
          transition={active && reduceMotion ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        >
          {children}
        </motion.span>
        {sweeping ? (
          // Clipped to the text box, so the band never pokes out (and never adds scroll overflow) at either end.
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
            <motion.span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: band, x, maskImage: MASK, WebkitMaskImage: MASK }}
            >
              <motion.span
                className={cn("absolute inset-y-0 left-0 whitespace-nowrap", highlightClassName ?? "text-foreground")}
                style={{ width, x: counterX }}
              >
                {children}
              </motion.span>
            </motion.span>
          </span>
        ) : null}
      </span>
    </span>
  );
}
