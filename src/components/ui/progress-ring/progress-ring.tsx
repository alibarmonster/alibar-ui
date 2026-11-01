"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface ProgressRingProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Current value. The ring and the label animate to it together. */
  value: number;
  /** Value at a full ring. @default 100 */
  max?: number;
  /** Accessible name, e.g. "Upload progress". */
  label: string;
  /** Diameter in px. @default 120 */
  size?: number;
  /** Ring thickness in px. @default 10 */
  thickness?: number;
  /** Fill color; the track is a light step of the same color. @default "var(--primary)" */
  color?: string;
  /** Text in the middle, given the animated value. @default a rounded percentage */
  formatValue?: (value: number, max: number) => string;
  /** Show the value in the middle. @default true */
  showValue?: boolean;
  /** Small caption under the value. */
  caption?: string;
}

const percentOf = (value: number, max: number) => `${Math.round((value / (max || 1)) * 100)}%`;

export function ProgressRing({
  value,
  max = 100,
  label,
  size = 120,
  thickness = 10,
  color = "var(--primary)",
  formatValue = percentOf,
  showValue = true,
  caption,
  className,
  style,
  ...props
}: ProgressRingProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const target = Math.min(Math.max(value, 0), max);
  // One motion value drives both the stroke and the label, so they always agree.
  const progress = useMotionValue(0);
  const fraction = useTransform(progress, (v) => Math.min(1, Math.max(0, v / (max || 1))));
  const capOpacity = useTransform(fraction, (v) => (v > 0.001 ? 1 : 0));
  const text = useTransform(progress, (v) => formatValue(v, max));

  useEffect(() => {
    if (reduceMotion) {
      progress.set(target);
      return;
    }
    if (!inView) return;
    const controls = animate(progress, target, { duration: 1.1, ease: ease.out });
    return () => controls.stop();
  }, [target, inView, reduceMotion, progress]);

  const r = (size - thickness) / 2;
  const c = size / 2;

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={target}
      aria-valuetext={formatValue(target, max)}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke={`color-mix(in oklab, ${color} 14%, var(--background))`} strokeWidth={thickness} />
        <motion.circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          style={{ pathLength: fraction, opacity: capOpacity }}
        />
      </svg>
      {showValue ? (
        <div aria-hidden="true" className="relative flex flex-col items-center leading-none">
          <motion.span className="font-semibold tracking-tight text-foreground" style={{ fontSize: Math.max(12, size * 0.2) }}>
            {text}
          </motion.span>
          {caption ? <span className="mt-1 text-xs text-muted-foreground">{caption}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
