"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedBeamProps {
  /** Positioned element that contains both endpoints; the beam is drawn over it. */
  containerRef: RefObject<HTMLElement | null>;
  /** Element the beam starts from. */
  fromRef: RefObject<HTMLElement | null>;
  /** Element the beam ends at. */
  toRef: RefObject<HTMLElement | null>;
  /** Bend of the curve in pixels; positive bends up, negative down. @default 0 */
  curvature?: number;
  /** Send the pulse from `to` back to `from`. @default false */
  reverse?: boolean;
  /** Seconds for one pulse. @default 3 */
  duration?: number;
  /** Seconds before the first pulse. @default 0 */
  delay?: number;
  /** Color of the resting path. @default "var(--border)" */
  pathColor?: string;
  /** Path width in pixels. @default 2 */
  pathWidth?: number;
  /** Pulse color at the start of the beam. @default "var(--primary)" */
  gradientStartColor?: string;
  /** Pulse color at the end of the beam. @default "#A855F7" */
  gradientStopColor?: string;
  /** Pulse length as a share of the path, 0.05–0.5. @default 0.2 */
  pulseLength?: number;
  /** Horizontal offset from the start element's center, in pixels. @default 0 */
  startXOffset?: number;
  /** Vertical offset from the start element's center, in pixels. @default 0 */
  startYOffset?: number;
  /** Horizontal offset from the end element's center, in pixels. @default 0 */
  endXOffset?: number;
  /** Vertical offset from the end element's center, in pixels. @default 0 */
  endYOffset?: number;
  /** Extra classes for the SVG. */
  className?: string;
}

interface Geometry {
  width: number;
  height: number;
  d: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 3,
  delay = 0,
  pathColor = "var(--border)",
  pathWidth = 2,
  gradientStartColor = "var(--primary)",
  gradientStopColor = "#A855F7",
  pulseLength = 0.2,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  className,
}: AnimatedBeamProps) {
  const id = useId();
  const pulse = useRef<SVGPathElement>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  // Measure endpoints relative to the container; re-measure whenever any of them resizes.
  useEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;
    const measure = () => {
      const c = container.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const x1 = a.left - c.left + a.width / 2 + startXOffset;
      const y1 = a.top - c.top + a.height / 2 + startYOffset;
      const x2 = b.left - c.left + b.width / 2 + endXOffset;
      const y2 = b.top - c.top + b.height / 2 + endYOffset;
      // Control point: the midpoint pushed along the perpendicular by `curvature`.
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.hypot(dx, dy) || 1;
      const cx = (x1 + x2) / 2 + (dy / length) * curvature;
      const cy = (y1 + y2) / 2 - (dx / length) * curvature;
      setGeometry({ width: c.width, height: c.height, d: `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`, x1, y1, x2, y2 });
    };
    const first = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    [container, from, to].forEach((el) => observer.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(first);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  // The pulse is a dash travelling along the path (Web Animations API, no per-frame JS).
  useEffect(() => {
    const path = pulse.current;
    if (!path || !geometry) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | null = null;
    const start = () => {
      animation?.cancel();
      animation = null;
      if (query.matches) {
        path.style.strokeDasharray = "none";
        path.style.opacity = "0.45";
        return;
      }
      path.style.strokeDasharray = `${pulseLength} ${1 - pulseLength}`;
      path.style.opacity = "1";
      const frames = reverse
        ? [{ strokeDashoffset: -1 }, { strokeDashoffset: pulseLength }]
        : [{ strokeDashoffset: pulseLength }, { strokeDashoffset: -1 }];
      animation = path.animate(frames, { duration: duration * 1000, delay: delay * 1000, iterations: Infinity, easing: "cubic-bezier(0.45, 0, 0.55, 1)", fill: "backwards" });
    };
    start();
    query.addEventListener("change", start);
    return () => {
      query.removeEventListener("change", start);
      animation?.cancel();
    };
  }, [geometry, duration, delay, reverse, pulseLength]);

  if (!geometry) return null;
  return (
    <svg
      aria-hidden="true"
      width={geometry.width}
      height={geometry.height}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      className={cn("pointer-events-none absolute top-0 left-0 overflow-visible", className)}
    >
      <defs>
        <linearGradient id={`${id}-beam`} gradientUnits="userSpaceOnUse" x1={geometry.x1} y1={geometry.y1} x2={geometry.x2} y2={geometry.y2}>
          <stop offset="0" style={{ stopColor: gradientStartColor }} />
          <stop offset="1" style={{ stopColor: gradientStopColor }} />
        </linearGradient>
      </defs>
      <path d={geometry.d} fill="none" stroke={pathColor} strokeWidth={pathWidth} strokeLinecap="round" />
      <path
        ref={pulse}
        d={geometry.d}
        fill="none"
        stroke={`url(#${id}-beam)`}
        strokeWidth={pathWidth}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${pulseLength} ${1 - pulseLength}`}
        strokeDashoffset={pulseLength}
      />
    </svg>
  );
}
