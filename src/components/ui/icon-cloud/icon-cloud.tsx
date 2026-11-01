"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CloudIcon {
  /** Name read by screen readers. */
  name: string;
  icon: ReactNode;
}

export interface IconCloudProps extends Omit<ComponentProps<"div">, "children"> {
  /** Icons placed evenly over a sphere. */
  icons: CloudIcon[];
  /** Auto-rotation in radians per second. @default 0.35 */
  speed?: number;
  /** Drag to spin, with a little inertia. @default true */
  draggable?: boolean;
  /** Icon tile size in pixels. @default 40 */
  iconSize?: number;
  /** Accessible label for the cloud. @default "Technologies" */
  label?: string;
}

function spherePoints(count: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    // Half-step offset keeps icons off the exact poles, where rotation would leave them still.
    const y = 1 - ((i + 0.5) / count) * 2;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(golden * i) * r, y, Math.sin(golden * i) * r] as [number, number, number];
  });
}

function place(point: [number, number, number], yaw: number, pitch: number, radius: number) {
  const [x, y, z] = point;
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  const depth = (z2 + 1) / 2; // 0 back … 1 front
  return {
    transform: `translate(-50%, -50%) translate3d(${(x1 * radius).toFixed(1)}px, ${(-y2 * radius).toFixed(1)}px, 0) scale(${(0.55 + depth * 0.55).toFixed(3)})`,
    opacity: (0.25 + depth * 0.75).toFixed(3),
    zIndex: String(Math.round(depth * 100)),
  };
}

export function IconCloud({ icons, speed = 0.35, draggable = true, iconSize = 40, label = "Technologies", className, ...props }: IconCloudProps) {
  const root = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);
  const points = spherePoints(icons.length);
  // Server render and first paint use the resting pose, at a fixed radius until measured.
  const initialRadius = 120;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pts = spherePoints(items.current.length);
    let radius = el.clientWidth * 0.38;
    let yaw = 0;
    let pitch = -0.25;
    let vx = speed;
    let vy = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let last = 0;
    let visible = true;

    const apply = () => {
      items.current.forEach((node, i) => {
        if (!node) return;
        const pose = place(pts[i], yaw, pitch, radius);
        node.style.transform = pose.transform;
        node.style.opacity = pose.opacity;
        node.style.zIndex = pose.zIndex;
      });
    };
    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!dragging) {
        // Ease any fling back toward the steady auto-rotation.
        vx += (speed - vx) * Math.min(1, dt * 1.5);
        vy *= 1 - Math.min(1, dt * 2.5);
        yaw += vx * dt;
        pitch = Math.max(-1.2, Math.min(1.2, pitch + vy * dt));
      }
      apply();
      if (visible && !reduce.matches && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    apply();
    run();
    const resize = new ResizeObserver(() => {
      radius = el.clientWidth * 0.38;
      apply();
    });
    resize.observe(el);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) run();
    });
    intersection.observe(el);
    const onVisibility = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", onVisibility);

    const onDown = (event: PointerEvent) => {
      if (!draggable || event.button !== 0) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      if (!el.hasPointerCapture(event.pointerId)) el.setPointerCapture(event.pointerId);
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      yaw += dx * 0.01;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + dy * 0.01));
      vx = dx * 0.6;
      vy = dy * 0.6;
      apply();
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
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [speed, draggable, icons.length]);

  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      className={cn("relative aspect-square w-full max-w-sm min-w-64 touch-none select-none", draggable && "cursor-grab active:cursor-grabbing", className)}
      {...props}
    >
      <ul className="sr-only">
        {icons.map((item) => (
          <li key={item.name}>{item.name}</li>
        ))}
      </ul>
      {icons.map((item, i) => (
        <span
          key={item.name}
          ref={(node) => {
            items.current[i] = node;
          }}
          aria-hidden="true"
          title={item.name}
          className="absolute top-1/2 left-1/2 grid place-items-center rounded-xl border border-border bg-background text-foreground shadow-sm will-change-transform [&>svg]:size-[55%]"
          style={{ width: iconSize, height: iconSize, ...place(points[i], 0, -0.25, initialRadius) }}
        >
          {item.icon}
        </span>
      ))}
    </div>
  );
}
