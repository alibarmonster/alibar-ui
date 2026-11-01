"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BorderBeamProps extends Omit<ComponentProps<"div">, "children"> {
  /** The card content. */
  children: ReactNode;
  /** Seconds for one lap. @default 6 */
  duration?: number;
  /** Color of the beam's soft tail. @default "var(--primary)" */
  colorFrom?: string;
  /** Color of the beam's bright head. @default "#A855F7" */
  colorTo?: string;
  /** Beam length as a share of the border, 0.05–0.5. @default 0.18 */
  size?: number;
  /** Corner radius in pixels; match the card's. @default 16 */
  radius?: number;
  /** Beam width in pixels. @default 1.5 */
  borderWidth?: number;
  /** Travel counter-clockwise. @default false */
  reverse?: boolean;
  /** Seconds before the first lap (offset several beams). @default 0 */
  delay?: number;
}

export function BorderBeam({
  children,
  duration = 6,
  colorFrom = "var(--primary)",
  colorTo = "#A855F7",
  size = 0.18,
  radius = 16,
  borderWidth = 1.5,
  reverse = false,
  delay = 0,
  className,
  style,
  ...props
}: BorderBeamProps) {
  const beam = useRef<SVGGElement>(null);

  useEffect(() => {
    const group = beam.current;
    if (!group) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];
    const start = () => {
      animations.forEach((a) => a.cancel());
      animations = [];
      if (query.matches) return;
      group.querySelectorAll("rect").forEach((rect) => {
        const from = Number(rect.dataset.offset ?? 0);
        const frames = reverse ? [{ strokeDashoffset: from - 1 }, { strokeDashoffset: from }] : [{ strokeDashoffset: from }, { strokeDashoffset: from - 1 }];
        animations.push(rect.animate(frames, { duration: duration * 1000, delay: delay * 1000, iterations: Infinity, easing: "linear" }));
      });
    };
    start();
    query.addEventListener("change", start);
    return () => {
      query.removeEventListener("change", start);
      animations.forEach((a) => a.cancel());
    };
  }, [duration, reverse, delay]);

  const head = Math.min(0.08, size / 3);
  const rect = { x: borderWidth / 2, y: borderWidth / 2, rx: radius, fill: "none", pathLength: 1, style: { width: `calc(100% - ${borderWidth}px)`, height: `calc(100% - ${borderWidth}px)` } };

  return (
    <div className={cn("relative rounded-2xl border border-border bg-background", className)} style={{ borderRadius: radius, ...style }} {...props}>
      {children}
      <svg aria-hidden="true" className="pointer-events-none absolute -inset-px size-[calc(100%+2px)] overflow-visible">
        <g ref={beam}>
          <rect {...rect} stroke={colorFrom} strokeOpacity={0.55} strokeWidth={borderWidth} strokeDasharray={`${size} ${1 - size}`} strokeDashoffset={0} data-offset={0} />
          <rect
            {...rect}
            stroke={colorTo}
            strokeWidth={borderWidth + 0.5}
            strokeLinecap="round"
            strokeDasharray={`${head} ${1 - head}`}
            strokeDashoffset={reverse ? 0 : -(size - head)}
            data-offset={reverse ? 0 : -(size - head)}
            style={{ ...rect.style, filter: `drop-shadow(0 0 4px ${colorTo})` }}
          />
        </g>
      </svg>
    </div>
  );
}
