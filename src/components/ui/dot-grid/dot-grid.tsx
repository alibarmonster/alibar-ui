"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface DotGridProps extends ComponentProps<"div"> {
  /** Distance between dots in px. @default 20 */
  gap?: number;
  /** Dot radius in px at rest. @default 1.4 */
  dotSize?: number;
  /** Distance in px over which the cursor's influence fades out. @default 130 */
  radius?: number;
  /** Dot scale right under the cursor. @default 2.6 */
  maxScale?: number;
  /** Resting dot color; any CSS color, including var() and color-mix(). @default "color-mix(in oklab, var(--muted-foreground) 35%, transparent)" */
  color?: string;
  /** Color dots blend toward near the cursor. @default "var(--primary)" */
  activeColor?: string;
}

type RGBA = [number, number, number, number];

/** Resolves any CSS color (var(), color-mix(), oklch…) to RGBA by letting the browser paint it. */
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

export function DotGrid({
  gap = 20,
  dotSize = 1.4,
  radius = 130,
  maxScale = 2.6,
  color = "color-mix(in oklab, var(--muted-foreground) 35%, transparent)",
  activeColor = "var(--primary)",
  className,
  children,
  ...props
}: DotGridProps) {
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
    let ox = 0;
    let oy = 0;
    let influence = new Float32Array(0);
    let base: RGBA = [0, 0, 0, 0];
    let active: RGBA = [0, 0, 0, 1];
    const pointer = { x: 0, y: 0, inside: false };
    let frame = 0;
    let running = false;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      let settled = true;
      // Idle dots share one path and one fill; only dots near the cursor are drawn individually.
      ctx.beginPath();
      const lit: number[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = ox + c * gap;
          const y = oy + r * gap;
          let target = 0;
          if (pointer.inside) {
            const d = Math.hypot(x - pointer.x, y - pointer.y);
            if (d < radius) target = 0.5 + 0.5 * Math.cos((Math.PI * d) / radius);
          }
          const v = (influence[i] += (target - influence[i]) * (reduce ? 1 : 0.16));
          if (Math.abs(target - v) > 0.003) settled = false;
          if (v < 0.01) {
            ctx.moveTo(x + dotSize, y);
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          } else lit.push(i);
        }
      }
      ctx.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${base[3]})`;
      ctx.fill();
      for (const i of lit) {
        const v = influence[i];
        const x = ox + (i % cols) * gap;
        const y = oy + Math.floor(i / cols) * gap;
        const mix = (k: number) => Math.round(base[k] + (active[k] - base[k]) * v);
        ctx.fillStyle = `rgba(${mix(0)},${mix(1)},${mix(2)},${base[3] + (active[3] - base[3]) * v})`;
        ctx.beginPath();
        ctx.arc(x, y, dotSize * (1 + (maxScale - 1) * v), 0, Math.PI * 2);
        ctx.fill();
      }
      return settled;
    };

    // The loop only runs while dots are still easing; at rest the canvas is static.
    const tick = () => {
      const settled = draw();
      if (settled && !pointer.inside) running = false;
      else frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
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
      ox = (width - (cols - 1) * gap) / 2;
      oy = (height - (rows - 1) * gap) / 2;
      influence = new Float32Array(cols * rows);
      base = resolveColor(root, color);
      active = resolveColor(root, activeColor);
      draw();
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = event.pointerType === "mouse" || event.pointerType === "pen";
      start();
    };
    const onLeave = () => {
      pointer.inside = false;
      start();
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [gap, dotSize, radius, maxScale, color, activeColor]);

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden", className)} {...props}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  );
}
