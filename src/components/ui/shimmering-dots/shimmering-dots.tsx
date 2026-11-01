"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface ShimmeringDotsProps extends ComponentProps<"div"> {
  /** Distance between dots in px. @default 14 */
  gap?: number;
  /** Dot size in px (square dots). @default 2 */
  size?: number;
  /** Dot color; any CSS color. @default "var(--primary)" */
  color?: string;
  /** Opacity of a resting dot. @default 0.16 */
  baseOpacity?: number;
  /** Opacity at the peak of a twinkle. @default 1 */
  peakOpacity?: number;
  /** Fraction of dots that twinkle, 0–1. @default 0.22 */
  density?: number;
  /** Twinkle speed multiplier. @default 1 */
  speed?: number;
  /** Fade the grid out toward the edges. @default true */
  fade?: boolean;
}

type RGBA = [number, number, number, number];

function resolveColor(host: HTMLElement, color: string): RGBA {
  const probe = document.createElement("span");
  probe.style.color = color;
  host.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return [0, 0, 0, 1];
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

const EDGE_FADE = "radial-gradient(ellipse at center, #000 45%, transparent 85%)";

export function ShimmeringDots({
  gap = 14,
  size = 2,
  color = "var(--primary)",
  baseOpacity = 0.16,
  peakOpacity = 1,
  density = 0.22,
  speed = 1,
  fade = true,
  className,
  style,
  children,
  ...props
}: ShimmeringDotsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    // Per dot: phase and frequency; frequency 0 means the dot never twinkles.
    let phase = new Float32Array(0);
    let freq = new Float32Array(0);
    let frame = 0;
    let visible = true;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      const ox = (width - (cols - 1) * gap - size) / 2;
      const oy = (height - (rows - 1) * gap - size) / 2;
      for (let i = 0; i < cols * rows; i++) {
        let o = baseOpacity;
        if (freq[i]) {
          // Sharpened sine: dots spend most of their time dim and flash briefly.
          const s = reduce ? 0.5 : Math.sin(t * 0.001 * freq[i] * speed + phase[i]);
          if (s > 0) o += (peakOpacity - baseOpacity) * s ** 6;
        }
        ctx.globalAlpha = o;
        ctx.fillRect(ox + (i % cols) * gap, oy + Math.floor(i / cols) * gap, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(frame);
      if (!reduce && visible) frame = requestAnimationFrame(tick);
      else draw(0);
    };

    const layout = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(width / gap) + 1;
      rows = Math.floor(height / gap) + 1;
      phase = new Float32Array(cols * rows);
      freq = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) {
        phase[i] = Math.random() * Math.PI * 2;
        freq[i] = Math.random() < density ? 0.6 + Math.random() * 1.6 : 0;
      }
      const [r, g, b] = resolveColor(root, color);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      draw(performance.now());
    };

    layout();
    run();
    const resizeObserver = new ResizeObserver(() => {
      layout();
      run();
    });
    resizeObserver.observe(root);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    });
    intersection.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
    };
  }, [gap, size, color, baseOpacity, peakOpacity, density, speed]);

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden", className)} style={style} {...props}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 size-full"
        style={fade ? { maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE } : undefined}
      />
      {children}
    </div>
  );
}
