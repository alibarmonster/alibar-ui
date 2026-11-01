"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface AnimatedGridPatternProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the pattern. */
  children?: ReactNode;
  /** Cell size in pixels. @default 36 */
  cellSize?: number;
  /** Squares lit at any moment. @default 18 */
  count?: number;
  /** Peak opacity of a lit square. @default 0.35 */
  maxOpacity?: number;
  /** Seconds for one square to fade in and out. @default 4 */
  duration?: number;
  /** Lit square color. @default "var(--primary)" */
  color?: string;
  /** Fade the pattern out toward the edges. @default true */
  fade?: boolean;
}

interface Square {
  key: number;
  col: number;
  row: number;
}

/** Small deterministic PRNG, so server and client place the first squares identically. */
function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function AnimatedGridPattern({
  children,
  cellSize = 36,
  count = 18,
  maxOpacity = 0.35,
  duration = 4,
  color = "var(--primary)",
  fade = true,
  className,
  ...props
}: AnimatedGridPatternProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const random = useRef(mulberry(7));
  const nextKey = useRef(count);
  const [grid, setGrid] = useState({ cols: 0, rows: 0 });
  const [squares, setSquares] = useState<Square[]>([]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const cols = Math.max(1, Math.floor(entry.contentRect.width / cellSize));
      const rows = Math.max(1, Math.floor(entry.contentRect.height / cellSize));
      setGrid((g) => (g.cols === cols && g.rows === rows ? g : { cols, rows }));
      setSquares((list) =>
        list.length === count && list.every((s) => s.col < cols && s.row < rows)
          ? list
          : Array.from({ length: count }, (_, i) => ({ key: i, col: Math.floor(random.current() * cols), row: Math.floor(random.current() * rows) })),
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [cellSize, count]);

  // When a square finishes its fade, it reappears somewhere new.
  const respawn = (key: number) => {
    setSquares((list) =>
      list.map((s) => (s.key === key ? { key: nextKey.current++, col: Math.floor(random.current() * grid.cols), row: Math.floor(random.current() * grid.rows) } : s)),
    );
  };

  return (
    <div ref={root} className={cn("relative isolate overflow-hidden", className)} {...props}>
      <svg
        aria-hidden="true"
        className={cn("absolute inset-0 -z-10 size-full", fade && "[mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]")}
      >
        <defs>
          <pattern id={`${id}-grid`} width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
            <path d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} fill="none" stroke="var(--border)" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id}-grid)`} />
        {squares.map((square, i) => (
          <motion.rect
            key={square.key}
            x={square.col * cellSize + 1}
            y={square.row * cellSize + 1}
            width={cellSize - 1}
            height={cellSize - 1}
            style={{ fill: color }}
            initial={{ opacity: 0 }}
            animate={reduceMotion ? { opacity: maxOpacity * 0.5 } : { opacity: [0, maxOpacity, 0] }}
            transition={reduceMotion ? { duration: 0 } : { duration, delay: square.key < count ? (i * duration) / count : 0, ease: "easeInOut" }}
            onAnimationComplete={() => {
              if (!reduceMotion) respawn(square.key);
            }}
          />
        ))}
      </svg>
      {children}
    </div>
  );
}
