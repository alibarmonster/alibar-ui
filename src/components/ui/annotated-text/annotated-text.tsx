"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export type AnnotationType = "underline" | "highlight" | "circle" | "box" | "strike" | "bracket";

export interface AnnotatedTextProps extends Omit<ComponentProps<"span">, "children"> {
  /** The text to annotate. Can wrap across lines (underline, highlight and strike follow each line). */
  children: ReactNode;
  /** Annotation style. @default "underline" */
  type?: AnnotationType;
  /** Stroke or marker color. @default "var(--primary)", or a soft amber for highlight */
  color?: string;
  /** Stroke width in px (not used by highlight). @default 2 */
  strokeWidth?: number;
  /** Seconds to draw. @default 0.8 */
  duration?: number;
  /** Seconds before drawing starts; chain several annotations by staggering this. @default 0 */
  delay?: number;
  /** Draw on mount, when scrolled into view, or whenever `show` is true. @default "inView" */
  trigger?: "inView" | "mount" | "manual";
  /** Shows or hides the annotation when trigger is "manual". */
  show?: boolean;
  /** Space between the text and the mark, in px. @default 4 */
  padding?: number;
  /** Draw the stroke twice, the second pass slightly off, like a real pen. @default 1 */
  iterations?: 1 | 2;
}

type Line = { x: number; y: number; w: number; h: number };
type Mark = { d: string; fill?: boolean; delay: number; duration: number };

/** Small deterministic PRNG, so a mark keeps the same wobble across re-measures. */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

const f = (n: number) => Math.round(n * 10) / 10;

function marks(type: AnnotationType, lines: Line[], pad: number, iterations: number, total: number, seed: number): Mark[] {
  const rand = random(seed);
  const j = (amount: number) => (rand() - 0.5) * 2 * amount;
  const out: Mark[] = [];
  const passes = type === "highlight" || type === "bracket" ? 1 : iterations;

  if (type === "underline" || type === "strike" || type === "highlight") {
    // One stroke per line, drawn in sequence, each taking its share of the time by width.
    const widths = lines.reduce((sum, l) => sum + l.w, 0) || 1;
    for (let pass = 0; pass < passes; pass++) {
      let start = pass * total * 0.55;
      for (const l of lines) {
        const share = (total * l.w) / widths;
        const x0 = l.x - pad * 0.5 + j(1);
        const x1 = l.x + l.w + pad * 0.5 + j(1);
        if (type === "highlight") {
          const top = l.y + l.h * 0.12;
          const bottom = l.y + l.h * 0.94;
          const mid = (x0 + x1) / 2;
          out.push({
            d: `M${f(x0)} ${f(top + j(1.5))} Q${f(mid)} ${f(top + j(2))} ${f(x1)} ${f(top + j(1.5))} L${f(x1 + j(2))} ${f(bottom + j(1.5))} Q${f(mid)} ${f(bottom + j(2))} ${f(x0 + j(2))} ${f(bottom + j(1.5))}Z`,
            fill: true,
            delay: start,
            duration: share,
          });
        } else {
          const y = type === "underline" ? l.y + l.h - l.h * 0.04 : l.y + l.h * 0.56;
          const w = x1 - x0;
          out.push({
            d: `M${f(x0)} ${f(y + j(1.5))} C${f(x0 + w * 0.3)} ${f(y + j(2.5))} ${f(x0 + w * 0.7)} ${f(y + j(2.5))} ${f(x1)} ${f(y - 1 + j(1.5))}`,
            delay: start,
            duration: share,
          });
        }
        start += share;
      }
    }
    return out;
  }

  // Shapes around the whole text use its bounding box.
  const left = Math.min(...lines.map((l) => l.x));
  const top = Math.min(...lines.map((l) => l.y));
  const right = Math.max(...lines.map((l) => l.x + l.w));
  const bottom = Math.max(...lines.map((l) => l.y + l.h));

  for (let pass = 0; pass < passes; pass++) {
    const delay = pass * total * 0.6;
    if (type === "circle") {
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      const rx = (right - left) / 2 + pad + 3;
      const ry = (bottom - top) / 2 + pad + 1;
      const from = -Math.PI * 0.62 + j(0.15);
      const sweep = Math.PI * 2 + 0.35;
      const wobble = rand() * Math.PI * 2;
      const points: [number, number][] = [];
      for (let k = 0; k <= 40; k++) {
        const a = from + (sweep * k) / 40;
        const r = 1 + 0.035 * Math.sin(a * 3 + wobble) + (k / 40) * 0.05;
        points.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
      }
      let d = `M${f(points[0][0])} ${f(points[0][1])}`;
      for (let k = 1; k < points.length - 1; k++) {
        const [x, y] = points[k];
        const [nx, ny] = points[k + 1];
        d += ` Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
      }
      out.push({ d, delay, duration: total });
    } else if (type === "box") {
      const x0 = left - pad - 2;
      const y0 = top - pad + 1;
      const x1 = right + pad + 2;
      const y1 = bottom + pad - 1;
      out.push({
        d: `M${f(x0 - 3 + j(1))} ${f(y0 + j(1))} L${f(x1 + j(1.5))} ${f(y0 + j(1.5))} L${f(x1 + j(1.5))} ${f(y1 + j(1.5))} L${f(x0 + j(1.5))} ${f(y1 + j(1.5))} L${f(x0 + j(1))} ${f(y0 - 3)}`,
        delay,
        duration: total,
      });
    } else {
      const x0 = left - pad;
      const x1 = right + pad;
      const y0 = top - 2;
      const y1 = bottom + 2;
      const arm = Math.min(10, (right - left) / 4);
      out.push({ d: `M${f(x0 + arm)} ${f(y0 + j(1))} L${f(x0 + j(1))} ${f(y0)} L${f(x0 + j(1))} ${f(y1)} L${f(x0 + arm)} ${f(y1 + j(1))}`, delay, duration: total });
      out.push({ d: `M${f(x1 - arm)} ${f(y0 + j(1))} L${f(x1 + j(1))} ${f(y0)} L${f(x1 + j(1))} ${f(y1)} L${f(x1 - arm)} ${f(y1 + j(1))}`, delay, duration: total });
    }
  }
  return out;
}

export function AnnotatedText({
  children,
  type = "underline",
  color,
  strokeWidth = 2,
  duration = 0.8,
  delay = 0,
  trigger = "inView",
  show,
  padding = 4,
  iterations = 1,
  className,
  ...props
}: AnnotatedTextProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const seed = hash(useId() + type);
  const [lines, setLines] = useState<Line[] | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const visible = trigger === "manual" ? !!show : trigger === "mount" || inView;

  // Positions of each line box, relative to the first one (where absolute children of an inline element start).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rects = Array.from(el.getClientRects()).filter((r) => r.width > 0);
        if (!rects.length) return;
        const origin = rects[0];
        setLines(rects.map((r) => ({ x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height })));
      });
    };
    measure();
    document.fonts?.ready.then(measure);
    // Inline boxes can't be observed directly; the parent block resizing is what rewraps the text.
    const observer = new ResizeObserver(measure);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const stroke = color ?? (type === "highlight" ? "color-mix(in oklab, var(--warning) 32%, transparent)" : "var(--primary)");
  const list = lines ? marks(type, lines, padding, iterations, duration, seed) : [];

  return (
    <span ref={ref} className={cn("relative", type === "highlight" && "z-0", className)} {...props}>
      {children}
      {list.length ? (
        <svg
          aria-hidden="true"
          width="1"
          height="1"
          className={cn("pointer-events-none absolute top-0 left-0 overflow-visible", type === "highlight" && "-z-10")}
        >
          {list.map((mark, i) =>
            mark.fill ? (
              // The marker sweeps open with scaleX: a transform, not a redraw.
              <motion.path
                key={i}
                d={mark.d}
                fill={stroke}
                style={{ originX: 0, transformBox: "fill-box" }}
                initial={reduceMotion ? { opacity: 0 } : { scaleX: 0, opacity: 1 }}
                animate={visible ? { scaleX: 1, opacity: 1 } : reduceMotion ? { opacity: 0 } : { scaleX: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.3, delay: visible ? delay : 0 }
                    : { duration: visible ? mark.duration : 0.25, delay: visible ? delay + mark.delay : 0, ease: ease.out }
                }
              />
            ) : (
              <motion.path
                key={i}
                d={mark.d}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduceMotion ? { opacity: 0, pathLength: 1 } : { pathLength: 0, opacity: 0 }}
                animate={visible ? { pathLength: 1, opacity: 1 } : reduceMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.3, delay: visible ? delay : 0 }
                    : {
                        pathLength: { duration: visible ? mark.duration : 0.25, delay: visible ? delay + mark.delay : 0, ease: ease.inOut },
                        opacity: { duration: 0.01, delay: visible ? delay + mark.delay : 0.25 },
                      }
                }
              />
            ),
          )}
        </svg>
      ) : null}
    </span>
  );
}
