"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface DonutDatum {
  /** Stable identity across updates; defaults to the label. */
  id?: string;
  /** Segment name. */
  label: string;
  /** Segment size; shares are computed from the total. */
  value: number;
  /** Segment color. Defaults to --chart-1 … --chart-5 by position in `data`. */
  color?: string;
}

export interface DonutChartProps
  extends Omit<ComponentProps<"figure">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Parts of one whole, in display order (clockwise from 12 o'clock). */
  data: DonutDatum[];
  /** Accessible name; also the caption of the screen-reader table. */
  label: string;
  /** Diameter in px. @default 200 */
  size?: number;
  /** Ring thickness in px. @default 24 */
  thickness?: number;
  /** Past this many segments, the smallest fold into "Other". @default 5 */
  maxSegments?: number;
  /** Caption under the total in the middle. @default "Total" */
  centerLabel?: string;
  /** Formats values in the middle, the legend and the table. */
  formatValue?: (value: number) => string;
  /** Show the legend with values and shares. @default true */
  legend?: boolean;
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const OTHER = "color-mix(in oklab, var(--muted-foreground) 40%, var(--background))";
const GAP = 2; // px of surface between segments
const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const f = (n: number) => Math.round(n * 100) / 100;

/** An annular sector from angle a0 to a1 (radians, clockwise from 3 o'clock). */
function sector(c: number, ro: number, ri: number, a0: number, a1: number) {
  const p = (r: number, a: number) => `${f(c + r * Math.cos(a))},${f(c + r * Math.sin(a))}`;
  if (a1 - a0 >= Math.PI * 2 - 1e-4) {
    const am = a0 + Math.PI;
    return `M${p(ro, a0)}A${ro},${ro} 0 1 1 ${p(ro, am)}A${ro},${ro} 0 1 1 ${p(ro, a0)}M${p(ri, a0)}A${ri},${ri} 0 1 0 ${p(ri, am)}A${ri},${ri} 0 1 0 ${p(ri, a0)}Z`;
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(ro, a0)}A${ro},${ro} 0 ${large} 1 ${p(ro, a1)}L${p(ri, a1)}A${ri},${ri} 0 ${large} 0 ${p(ri, a0)}Z`;
}

/** A clock-hand sweep as a clip-path polygon (constant point count, so it updates smoothly). */
function sweepPolygon(deg: number) {
  const points = ["50% 50%"];
  for (let k = 0; k <= 32; k++) {
    const a = ((-90 + (deg * k) / 32) * Math.PI) / 180;
    points.push(`${f(50 + 75 * Math.cos(a))}% ${f(50 + 75 * Math.sin(a))}%`);
  }
  return `polygon(${points.join(",")})`;
}

function Segment({
  a0,
  a1,
  size,
  thickness,
  color,
  dimmed,
  lifted,
  reduceMotion,
  onEnter,
}: {
  a0: number;
  a1: number;
  size: number;
  thickness: number;
  color: string;
  dimmed: boolean;
  lifted: boolean;
  reduceMotion: boolean;
  onEnter: () => void;
}) {
  const c = size / 2;
  const ro = c - 4; // room to lift outward
  const ri = ro - thickness;
  const gap = GAP / (ro - thickness / 2);
  // Angles spring to new values when the data changes; the path follows them.
  const start = useSpring(a0, spring.smooth);
  const end = useSpring(a1, spring.smooth);
  useEffect(() => {
    if (reduceMotion) {
      start.jump(a0);
      end.jump(a1);
    } else {
      start.set(a0);
      end.set(a1);
    }
  }, [a0, a1, reduceMotion, start, end]);
  const d = useTransform([start, end], ([s, e]: number[]) => (e - s > gap ? sector(c, ro, ri, s + gap / 2, e - gap / 2) : ""));
  const mid = (a0 + a1) / 2;

  return (
    <motion.path
      d={d}
      fill={color}
      fillRule="evenodd"
      onPointerEnter={onEnter}
      animate={{ opacity: dimmed ? 0.28 : 1, x: lifted ? Math.cos(mid) * 3 : 0, y: lifted ? Math.sin(mid) * 3 : 0 }}
      transition={reduceMotion ? { duration: 0 } : { ...spring.snappy, opacity: { duration: duration.quick } }}
    />
  );
}

export function DonutChart({
  data,
  label,
  size = 200,
  thickness = 24,
  maxSegments = 5,
  centerLabel = "Total",
  formatValue = (v) => full.format(v),
  legend = true,
  className,
  ...props
}: DonutChartProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [active, setActive] = useState<number | null>(null);
  const hintId = useId();

  // Color follows each item's position in `data`, never its rank, so filtering doesn't repaint survivors.
  const items = data.map((d, i) => ({ key: d.id ?? d.label, label: d.label, value: Math.max(0, d.value), color: d.color ?? COLORS[i % COLORS.length] }));
  let segments = items;
  if (items.length > maxSegments) {
    const keep = new Set([...items].sort((a, b) => b.value - a.value).slice(0, maxSegments - 1).map((s) => s.key));
    const rest = items.filter((s) => !keep.has(s.key));
    segments = [
      ...items.filter((s) => keep.has(s.key)),
      { key: "__other", label: `Other (${rest.length})`, value: rest.reduce((sum, s) => sum + s.value, 0), color: OTHER },
    ];
  }
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const arcs: ((typeof segments)[number] & { a0: number; a1: number; share: number })[] = [];
  for (const s of segments) {
    const a0 = arcs.length ? arcs[arcs.length - 1].a1 : -Math.PI / 2;
    const share = total ? s.value / total : 0;
    arcs.push({ ...s, a0, a1: a0 + share * Math.PI * 2, share });
  }

  const sweep = useMotionValue(0);
  const clipPath = useTransform(sweep, (deg) => (deg >= 360 ? "none" : sweepPolygon(deg)));
  useEffect(() => {
    if (reduceMotion) {
      sweep.set(360);
      return;
    }
    if (!inView) return;
    const controls = animate(sweep, 360, { duration: 0.9, ease: ease.out });
    return () => controls.stop();
  }, [inView, reduceMotion, sweep]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const n = arcs.length;
    if (!n) return;
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key];
    if (step !== undefined) setActive((a) => (a === null ? (step > 0 ? 0 : n - 1) : (a + step + n) % n));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(n - 1);
    else if (event.key === "Escape") setActive(null);
    else return;
    event.preventDefault();
  };

  const current = active === null ? null : arcs[active];

  return (
    <figure className={cn("flex flex-col items-center gap-6 sm:flex-row sm:gap-10", className)} {...props}>
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-roledescription="donut chart"
        aria-label={label}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          if (event.currentTarget.matches(":focus-visible")) setActive((a) => a ?? 0);
        }}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        style={{ width: size, height: size }}
      >
        <motion.div aria-hidden="true" className="absolute inset-0" style={{ clipPath }}>
          <svg width={size} height={size} className="overflow-visible">
            {arcs.map((s, i) => (
              <Segment
                key={s.key}
                a0={s.a0}
                a1={s.a1}
                size={size}
                thickness={thickness}
                color={s.color}
                dimmed={active !== null && active !== i}
                lifted={active === i}
                reduceMotion={reduceMotion}
                onEnter={() => setActive(i)}
              />
            ))}
          </svg>
        </motion.div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current?.key ?? "total"}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 4, filter: reduceMotion ? "blur(0px)" : "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: duration.instant } }}
              transition={{ duration: duration.base, ease: ease.out }}
              style={{ maxWidth: size - thickness * 2 - 16 }}
            >
              <div className="text-2xl font-semibold tracking-tight text-foreground">{formatValue(current ? current.value : total)}</div>
              <div className="truncate text-xs text-muted-foreground">
                {current ? `${current.label} · ${percent.format(current.share)}` : centerLabel}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {legend ? (
        <ul aria-hidden="true" className="w-full max-w-xs space-y-1 sm:w-64">
          {arcs.map((s, i) => (
            <li
              key={s.key}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-[background-color,opacity] duration-150",
                active === i && "bg-accent",
                active !== null && active !== i && "opacity-50",
              )}
            >
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
              <span className="min-w-0 flex-1 truncate text-foreground">{s.label}</span>
              <span className="text-muted-foreground tabular-nums">{formatValue(s.value)}</span>
              <span className="w-12 text-right text-muted-foreground tabular-nums">{percent.format(s.share)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p id={hintId} className="sr-only">
        Use the arrow keys to read each segment.
      </p>
      <p aria-live="polite" className="sr-only">
        {current ? `${current.label}: ${formatValue(current.value)}, ${percent.format(current.share)}` : ""}
      </p>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Segment</th>
            <th scope="col">Value</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {arcs.map((s) => (
            <tr key={s.key}>
              <th scope="row">{s.label}</th>
              <td>{formatValue(s.value)}</td>
              <td>{percent.format(s.share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
