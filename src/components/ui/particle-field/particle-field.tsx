"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface ParticleFieldProps extends ComponentProps<"div"> {
  /** Particles per 10,000 px² (capped at 180). @default 1.6 */
  density?: number;
  /** Particle color; any CSS color. @default "var(--muted-foreground)" */
  color?: string;
  /** Draw faint lines between nearby particles. @default true */
  links?: boolean;
  /** Distance in px under which particles are linked. @default 110 */
  linkDistance?: number;
  /** Radius in px of the cursor's push. @default 120 */
  repelRadius?: number;
  /** Strength of the cursor's push. @default 1 */
  repelStrength?: number;
  /** Drift speed in px per frame. @default 0.25 */
  speed?: number;
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

export function ParticleField({
  density = 1.6,
  color = "var(--muted-foreground)",
  links = true,
  linkDistance = 110,
  repelRadius = 120,
  repelStrength = 1,
  speed = 0.25,
  className,
  children,
  ...props
}: ParticleFieldProps) {
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
    let n = 0;
    // x, y, vx, vy, drift-x, drift-y, radius for each particle.
    let p = new Float32Array(0);
    let rgb: RGBA = [0, 0, 0, 1];
    const pointer = { x: 0, y: 0, inside: false };
    let frame = 0;
    let visible = true;

    const seed = () => {
      n = Math.min(180, Math.round(((width * height) / 10_000) * density));
      p = new Float32Array(n * 7);
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = speed * (0.4 + Math.random() * 0.6);
        p.set([Math.random() * width, Math.random() * height, Math.cos(angle) * s, Math.sin(angle) * s, Math.cos(angle) * s, Math.sin(angle) * s, 1 + Math.random() * 1.3], i * 7);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const [r, g, b, a] = rgb;
      if (links) {
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = 1;
        const max2 = linkDistance * linkDistance;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const dx = p[i * 7] - p[j * 7];
            const dy = p[i * 7 + 1] - p[j * 7 + 1];
            const d2 = dx * dx + dy * dy;
            if (d2 > max2) continue;
            ctx.globalAlpha = a * 0.35 * (1 - Math.sqrt(d2) / linkDistance);
            ctx.beginPath();
            ctx.moveTo(p[i * 7], p[i * 7 + 1]);
            ctx.lineTo(p[j * 7], p[j * 7 + 1]);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        ctx.moveTo(p[i * 7] + p[i * 7 + 6], p[i * 7 + 1]);
        ctx.arc(p[i * 7], p[i * 7 + 1], p[i * 7 + 6], 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const step = () => {
      for (let i = 0; i < n; i++) {
        const k = i * 7;
        // Velocity relaxes back toward the particle's own gentle drift after a push.
        p[k + 2] += (p[k + 4] - p[k + 2]) * 0.03;
        p[k + 3] += (p[k + 5] - p[k + 3]) * 0.03;
        if (pointer.inside) {
          const dx = p[k] - pointer.x;
          const dy = p[k + 1] - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < repelRadius && d > 0.01) {
            const force = (1 - d / repelRadius) * repelStrength * 0.9;
            p[k + 2] += (dx / d) * force;
            p[k + 3] += (dy / d) * force;
          }
        }
        p[k] += p[k + 2];
        p[k + 1] += p[k + 3];
        // Wrap around the edges.
        if (p[k] < -10) p[k] = width + 10;
        else if (p[k] > width + 10) p[k] = -10;
        if (p[k + 1] < -10) p[k + 1] = height + 10;
        else if (p[k + 1] > height + 10) p[k + 1] = -10;
      }
    };

    const tick = () => {
      step();
      draw();
      frame = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(frame);
      if (!reduce && visible) frame = requestAnimationFrame(tick);
    };

    const layout = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rgb = resolveColor(root, color);
      seed();
      draw();
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = event.pointerType === "mouse" || event.pointerType === "pen";
    };
    const onLeave = () => (pointer.inside = false);

    layout();
    run();
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(root);
    // Pause the simulation while the field is offscreen.
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    });
    intersection.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [density, color, links, linkDistance, repelRadius, repelStrength, speed]);

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden", className)} {...props}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  );
}
