"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface GlobeMarker {
  lat: number;
  lon: number;
  /** City or place name, included in the accessible description. */
  label?: string;
}

export interface GlobeArc {
  from: [lat: number, lon: number];
  to: [lat: number, lon: number];
}

export interface DottedGlobeProps extends Omit<ComponentProps<"div">, "children"> {
  /** Highlighted locations. */
  markers?: GlobeMarker[];
  /** Arcs between locations, drawn as lifted great circles. */
  arcs?: GlobeArc[];
  /** Land dot color. @default "#09090B" */
  dotColor?: string;
  /** Marker and arc color. @default "#2563EB" */
  accentColor?: string;
  /** Auto-rotation in degrees per second. @default 8 */
  speed?: number;
  /** Drag to rotate. @default true */
  draggable?: boolean;
  /** Accessible label. @default "Globe" */
  label?: string;
}

const RAD = Math.PI / 180;

/** Stylized continents from layered sines: a pleasant land mask without shipping map data. */
function isLand(lat: number, lon: number) {
  const a = Math.sin(lat * 2.6 + 1.1) * Math.cos(lon * 1.7 - 0.4);
  const b = 0.6 * Math.sin(lon * 3.1 + lat * 1.3 + 2.2);
  const c = 0.35 * Math.cos(lat * 5.3 - lon * 2.4);
  return a + b + c > 0.35 && Math.abs(lat) < 72 * RAD;
}

/** Evenly spread sphere points; the fourth value marks land (1) or ocean (0). */
function fibonacciSphere(count: number) {
  const points: [number, number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const lat = Math.asin(y);
    const lon = Math.atan2(x, z);
    points.push([x, y, z, isLand(lat, lon) ? 1 : 0]);
  }
  return points;
}

const toVector = (lat: number, lon: number): [number, number, number] => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];

export function DottedGlobe({
  markers = [],
  arcs = [],
  dotColor = "#09090B",
  accentColor = "#2563EB",
  speed = 8,
  draggable = true,
  label = "Globe",
  className,
  ...props
}: DottedGlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ markers, arcs, dotColor, accentColor, speed });
  useEffect(() => {
    latest.current = { markers, arcs, dotColor, accentColor, speed };
  });

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const points = fibonacciSphere(2400);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let yaw = -20 * RAD;
    let pitch = -0.32;
    let velocity = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let size = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = el.clientWidth;
      el.width = Math.round(size * dpr);
      el.height = Math.round(size * dpr);
    };

    const project = ([x, y, z]: readonly number[]) => {
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      return [x1, y2, z2] as const;
    };

    const draw = (time: number) => {
      const { markers: m, arcs: a, dotColor: dc, accentColor: ac } = latest.current;
      const R = size * 0.46;
      const c = size / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.strokeStyle = dc;
      ctx.globalAlpha = 0.08;
      ctx.stroke();
      ctx.fillStyle = dc;
      // Land dots are darker and larger; ocean dots stay faint so the sphere always reads.
      for (const p of points) {
        const [x, y, z] = project(p);
        const land = p[3] === 1;
        if (z <= 0) {
          if (!land) continue;
          ctx.globalAlpha = 0.05;
          ctx.fillRect(c + x * R - 0.4, c - y * R - 0.4, 0.8, 0.8);
          continue;
        }
        ctx.globalAlpha = land ? 0.3 + z * 0.6 : 0.06 + z * 0.1;
        const r = land ? 1.3 + z * 0.6 : 0.9;
        ctx.fillRect(c + x * R - r / 2, c - y * R - r / 2, r, r);
      }
      // Arcs: lifted great circles with a dash flowing along them.
      ctx.strokeStyle = ac;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      for (const arc of a) {
        const v1 = toVector(...arc.from);
        const v2 = toVector(...arc.to);
        const angle = Math.acos(Math.min(1, Math.max(-1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2])));
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= 40; s++) {
          const t = s / 40;
          const k1 = Math.sin((1 - t) * angle) / Math.sin(angle || 1);
          const k2 = Math.sin(t * angle) / Math.sin(angle || 1);
          const lift = 1 + Math.sin(t * Math.PI) * 0.18;
          const v: [number, number, number] = [(v1[0] * k1 + v2[0] * k2) * lift, (v1[1] * k1 + v2[1] * k2) * lift, (v1[2] * k1 + v2[2] * k2) * lift];
          const [x, y, z] = project(v);
          if (z < -0.05) {
            started = false;
            continue;
          }
          if (started) ctx.lineTo(c + x * R, c - y * R);
          else ctx.moveTo(c + x * R, c - y * R);
          started = true;
        }
        ctx.globalAlpha = 0.85;
        ctx.setLineDash([6, 8]);
        ctx.lineDashOffset = -time * 0.02;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Markers with a soft pulse.
      for (const marker of m) {
        const [x, y, z] = project(toVector(marker.lat, marker.lon));
        if (z <= 0) continue;
        const px = c + x * R;
        const py = c - y * R;
        const pulse = (time / 1600) % 1;
        ctx.globalAlpha = (1 - pulse) * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, 3 + pulse * 10, 0, Math.PI * 2);
        ctx.fillStyle = ac;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!dragging) {
        velocity *= 0.94;
        yaw += (latest.current.speed * RAD + velocity) * dt;
      }
      draw(now);
      if (visible && !reduce.matches && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    resize();
    draw(0);
    run();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    resizeObserver.observe(el);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) run();
    });
    intersection.observe(el);
    const onVisibility = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", onVisibility);

    const onDown = (event: PointerEvent) => {
      if (!draggable) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      el.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      yaw += dx * 0.008;
      pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * 0.006));
      velocity = dx * 0.4;
      draw(performance.now());
      run();
    };
    const onUp = () => {
      dragging = false;
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [draggable]);

  const places = markers.map((m) => m.label).filter(Boolean);
  return (
    <div className={cn("relative aspect-square w-full max-w-md min-w-64", className)} {...props}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={places.length ? `${label} showing ${places.join(", ")}` : label}
        className={cn("size-full touch-none", draggable && "cursor-grab active:cursor-grabbing")}
      />
    </div>
  );
}
