"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface ActivityRing {
  /** Stable identity; defaults to the label. */
  id?: string;
  /** Ring name, e.g. "Move". */
  label: string;
  /** Progress so far. Can pass the goal; the ring keeps going round. */
  value: number;
  /** Value that closes the ring. */
  goal: number;
  /** Unit shown in the legend, e.g. "kcal". */
  unit?: string;
  /** Ring color. Defaults to --chart-1, --chart-2, --chart-3, --chart-4 from the outside in. */
  color?: string;
}

export interface ActivityRingsProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** One to four rings, outermost first. */
  rings: ActivityRing[];
  /** Accessible name for the group. @default "Activity" */
  label?: string;
  /** Diameter in px. @default 180 */
  size?: number;
  /** Ring thickness in px. @default 16 */
  thickness?: number;
  /** Space between rings in px. @default 4 */
  gap?: number;
  /** Show the legend with values and goals. @default true */
  legend?: boolean;
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function Ring({
  radius,
  center,
  thickness,
  color,
  progress,
  delay,
  shown,
  reduceMotion,
}: {
  radius: number;
  center: number;
  thickness: number;
  color: string;
  progress: number;
  delay: number;
  shown: boolean;
  reduceMotion: boolean;
}) {
  const p = useMotionValue(0);
  useEffect(() => {
    if (reduceMotion) {
      p.set(progress);
      return;
    }
    if (!shown) return;
    const controls = animate(p, progress, { duration: 1.4, delay, ease: ease.out });
    return () => controls.stop();
  }, [progress, shown, reduceMotion, delay, p]);

  const firstLap = useTransform(p, (v) => Math.min(1, Math.max(0, v)));
  const secondLap = useTransform(p, (v) => Math.min(1, Math.max(0, v - 1)));
  const firstVisible = useTransform(p, (v) => (v > 0.002 ? 1 : 0));
  const secondVisible = useTransform(p, (v) => (v > 1.002 ? 1 : 0));
  // Past the goal, the lap's tip casts a small shadow on the ring underneath, so the overlap reads.
  const tipX = useTransform(secondLap, (v) => center + radius * Math.cos(v * Math.PI * 2));
  const tipY = useTransform(secondLap, (v) => center + radius * Math.sin(v * Math.PI * 2));
  const stroke = { cx: center, cy: center, r: radius, fill: "none", stroke: color, strokeWidth: thickness, strokeLinecap: "round" as const };

  return (
    <>
      <circle cx={center} cy={center} r={radius} fill="none" stroke={`color-mix(in oklab, ${color} 16%, var(--background))`} strokeWidth={thickness} />
      <motion.circle {...stroke} style={{ pathLength: firstLap, opacity: firstVisible }} />
      <motion.circle
        r={thickness / 2}
        cx={tipX}
        cy={tipY}
        fill={color}
        style={{ opacity: secondVisible, filter: "drop-shadow(0 0 2px rgb(0 0 0 / 0.45))" }}
      />
      <motion.circle {...stroke} style={{ pathLength: secondLap, opacity: secondVisible }} />
    </>
  );
}

export function ActivityRings({
  rings,
  label = "Activity",
  size = 180,
  thickness = 16,
  gap = 4,
  legend = true,
  className,
  ...props
}: ActivityRingsProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const center = size / 2;
  const items = rings.slice(0, 4).map((ring, i) => ({
    ...ring,
    key: ring.id ?? ring.label,
    color: ring.color ?? COLORS[i],
    radius: center - thickness / 2 - i * (thickness + gap),
    progress: ring.goal > 0 ? Math.max(0, ring.value / ring.goal) : 0,
  }));

  return (
    <div role="group" aria-label={label} className={cn("flex flex-col items-center gap-6 sm:flex-row sm:gap-8", className)} {...props}>
      <div ref={ref} className="shrink-0" style={{ width: size, height: size }}>
        {/* Rotated so every ring starts at 12 o'clock. */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible" aria-hidden="true">
          {items.map((ring, i) =>
            ring.radius > thickness / 2 ? (
              <Ring
                key={ring.key}
                radius={ring.radius}
                center={center}
                thickness={thickness}
                color={ring.color}
                progress={ring.progress}
                delay={i * 0.12}
                shown={inView}
                reduceMotion={reduceMotion}
              />
            ) : null,
          )}
        </svg>
      </div>
      {legend ? (
        <ul className="space-y-3">
          {items.map((ring) => (
            <li key={ring.key} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: ring.color }} />
              <div>
                <div className="text-sm text-muted-foreground">{ring.label}</div>
                <div className="text-lg font-semibold tracking-tight text-foreground">
                  {number.format(ring.value)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {number.format(ring.goal)}
                    {ring.unit ? ` ${ring.unit}` : ""}
                  </span>
                  <span className="ml-2 text-xs font-medium text-muted-foreground tabular-nums">{Math.round(ring.progress * 100)}%</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
