"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface RangeSliderProps
  extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Controlled value: one number, or two for a range. */
  value?: number[];
  /** Initial value when uncontrolled. @default [min] */
  defaultValue?: number[];
  /** Called on every change while dragging or using the keyboard. */
  onValueChange?: (value: number[]) => void;
  /** Called once a change is finished: pointer released or key pressed. */
  onValueCommit?: (value: number[]) => void;
  /** Lowest value. @default 0 */
  min?: number;
  /** Highest value. @default 100 */
  max?: number;
  /** Distance between values; the thumb snaps to each step. @default 1 */
  step?: number;
  /** Show a dot at every step. @default true when there are 20 steps or fewer */
  ticks?: boolean;
  /** Formats values for the tooltip and for screen readers. */
  formatValue?: (value: number) => string;
  /** When the value tooltip shows. @default "active" */
  tooltip?: "active" | "always" | "never";
  /** Accessible names for the thumbs, e.g. ["Minimum price", "Maximum price"]. */
  thumbLabels?: string[];
  /** Disables pointer and keyboard input. @default false */
  disabled?: boolean;
}

// A lightly damped spring, so the thumb overshoots a touch every time it snaps to a step.
const SNAP = { stiffness: 520, damping: 19, mass: 0.7 };

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

export function RangeSlider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  ticks,
  formatValue = (v) => String(v),
  tooltip = "active",
  thumbLabels,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  ...props
}: RangeSliderProps) {
  const [internal, setInternal] = useState(() => defaultValue ?? [min]);
  const values = (value ?? internal).map((v) => clamp(v, min, max));
  const range = values.length > 1;
  const [dragging, setDragging] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduceMotion = useReducedMotion();

  const percent = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const v0 = values[0];
  const v1 = values[1] ?? values[0];
  const p0 = useSpring(percent(v0), SNAP);
  const p1 = useSpring(percent(v1), SNAP);
  const x0 = useTransform(p0, (v) => `${v}%`);
  const x1 = useTransform(p1, (v) => `${v}%`);
  // The fill is clipped rather than scaled, so its rounded ends never stretch.
  const fillClip = useTransform(() => {
    const a = p0.get();
    const b = range ? p1.get() : a;
    const lo = range ? Math.min(a, b) : 0;
    const hi = range ? Math.max(a, b) : a;
    return `inset(0 ${100 - hi}% 0 ${lo}% round 9999px)`;
  });

  useEffect(() => {
    const t0 = ((v0 - min) / (max - min || 1)) * 100;
    const t1 = ((v1 - min) / (max - min || 1)) * 100;
    if (reduceMotion) {
      p0.jump(t0);
      p1.jump(t1);
    } else {
      p0.set(t0);
      p1.set(t1);
    }
  }, [v0, v1, min, max, reduceMotion, p0, p1]);

  const snap = (raw: number) => {
    const stepped = Math.round((raw - min) / step) * step + min;
    return clamp(Number(stepped.toFixed(decimals(step))), min, max);
  };

  function update(index: number, raw: number) {
    let next = snap(raw);
    // Range thumbs can meet but never cross.
    if (range) next = index === 0 ? Math.min(next, values[1]) : Math.max(next, values[0]);
    if (next === values[index]) return values;
    const updated = values.map((v, i) => (i === index ? next : v));
    if (value === undefined) setInternal(updated);
    onValueChange?.(updated);
    return updated;
  }

  function valueAt(clientX: number) {
    const rect = trackRef.current!.getBoundingClientRect();
    return min + clamp((clientX - rect.left) / rect.width, 0, 1) * (max - min);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    const target = valueAt(event.clientX);
    let index = 0;
    if (range) {
      if (target <= values[0]) index = 0;
      else if (target >= values[1]) index = 1;
      else index = target - values[0] <= values[1] - target ? 0 : 1;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    thumbRefs.current[index]?.focus({ preventScroll: true });
    setDragging(index);
    update(index, target);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragging !== null) update(dragging, valueAt(event.clientX));
  }

  function endDrag() {
    if (dragging === null) return;
    setDragging(null);
    onValueCommit?.(values);
  }

  function onThumbKey(index: number, event: KeyboardEvent<HTMLDivElement>) {
    const big = Math.max(step, snap(min + (max - min) / 10) - min);
    const current = values[index];
    const targets: Record<string, number> = {
      ArrowRight: current + step,
      ArrowUp: current + step,
      ArrowLeft: current - step,
      ArrowDown: current - step,
      PageUp: current + big,
      PageDown: current - big,
      Home: min,
      End: max,
    };
    if (!(event.key in targets) || disabled) return;
    event.preventDefault();
    // Not `onValueCommit?.(update(...))`: optional calls skip evaluating their arguments.
    const next = update(index, targets[event.key]);
    onValueCommit?.(next);
  }

  const stepCount = Math.round((max - min) / step);
  const showTicks = ticks ?? stepCount <= 20;
  const lo = range ? values[0] : min;
  const hi = range ? values[1] : values[0];

  return (
    <div
      role={range ? "group" : undefined}
      aria-label={range ? ariaLabel : undefined}
      className={cn("relative w-full touch-none select-none", disabled && "pointer-events-none opacity-50", className)}
      {...props}
    >
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative flex h-10 cursor-pointer items-center"
      >
        <div className="relative h-1.5 w-full rounded-full bg-muted">
          <motion.div className="absolute inset-0 rounded-full bg-primary" style={{ clipPath: fillClip }} />
          {showTicks
            ? Array.from({ length: stepCount + 1 }, (_, i) => {
                const tickValue = min + i * step;
                const inFill = tickValue >= lo && tickValue <= hi;
                return (
                  <span
                    key={i}
                    aria-hidden="true"
                    style={{ left: `${percent(tickValue)}%` }}
                    className={cn(
                      "absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-150",
                      inFill ? "bg-primary-foreground/80" : "bg-foreground/20",
                    )}
                  />
                );
              })
            : null}
        </div>

        {values.slice(0, 2).map((thumbValue, index) => {
          const showTooltip = tooltip === "always" || (tooltip === "active" && (dragging === index || focused === index));
          const label = thumbLabels?.[index] ?? (range ? (index === 0 ? "Minimum" : "Maximum") : ariaLabel);
          return (
            // Full-width layer translated by a percentage: the thumb sits on its left edge.
            <motion.div
              key={index}
              className="pointer-events-none absolute inset-y-0 left-0 w-full"
              style={{ x: index === 0 ? x0 : x1 }}
            >
              <motion.div
                ref={(node) => {
                  thumbRefs.current[index] = node;
                }}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={label}
                aria-valuemin={range && index === 1 ? values[0] : min}
                aria-valuemax={range && index === 0 ? values[1] : max}
                aria-valuenow={thumbValue}
                aria-valuetext={formatValue(thumbValue)}
                aria-orientation="horizontal"
                aria-disabled={disabled || undefined}
                onKeyDown={(event) => onThumbKey(index, event)}
                onFocus={() => setFocused(index)}
                onBlur={() => setFocused((f) => (f === index ? null : f))}
                animate={{ scale: dragging === index && !reduceMotion ? 1.15 : 1 }}
                transition={spring.snappy}
                className={cn(
                  "pointer-events-auto absolute top-1/2 left-0 size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-border bg-background outline-none",
                  "shadow-[0_1px_2px_rgb(0_0_0/0.12),0_2px_8px_-2px_rgb(0_0_0/0.18)] focus-visible:ring-4 focus-visible:ring-ring/30",
                  dragging === index && "cursor-grabbing",
                  dragging === index || focused === index ? "z-20" : "z-10",
                )}
              >
                <AnimatePresence>
                  {showTooltip ? (
                    <motion.span
                      aria-hidden="true"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
                      transition={{ duration: duration.quick, ease: ease.out }}
                      className="absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background tabular-nums shadow-md"
                    >
                      {formatValue(thumbValue)}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
