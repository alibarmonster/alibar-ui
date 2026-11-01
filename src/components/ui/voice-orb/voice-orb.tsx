"use client";

import { useEffect, useId, useRef, type ComponentProps } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking";

export interface VoiceOrbProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** What the assistant is doing; sets how much the orb moves. @default "idle" */
  state?: VoiceOrbState;
  /** Audio level from 0 to 1, e.g. from your own analyser. Ignored when `stream` is set. */
  level?: number;
  /** A microphone (or any audio) stream to measure the level from. */
  stream?: MediaStream | null;
  /** Diameter in px. @default 160 */
  size?: number;
  /** Three gradient colors. @default ["var(--chart-1)", "#8b5cf6", "#22d3ee"] */
  colors?: [string, string, string];
  /** Accessible name; the state is appended. @default "Voice assistant" */
  label?: string;
}

const STATE_TEXT: Record<VoiceOrbState, string> = { idle: "idle", listening: "listening", thinking: "thinking", speaking: "speaking" };
const POINTS = 10;

/** Smooth closed path through points (Catmull-Rom converted to cubic Béziers). */
function blobPath(points: [number, number][]) {
  const n = points.length;
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

export function VoiceOrb({
  state = "idle",
  level = 0,
  stream,
  size = 160,
  colors = ["var(--chart-1)", "#8b5cf6", "#22d3ee"],
  label = "Voice assistant",
  className,
  style,
  ...props
}: VoiceOrbProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const gradientId = useId();
  const live = useRef({ state, level, reduce: !!reduceMotion });
  useEffect(() => {
    live.current = { ...live.current, state, level, reduce: !!reduceMotion };
  });
  // The orb swells with the (smoothed) level; the glow brightens with it.
  const loudness = useMotionValue(0);
  const smooth = useSpring(loudness, { stiffness: 220, damping: 24 });
  const scale = useTransform(smooth, (v) => 1 + v * 0.18);
  const glow = useTransform(smooth, (v) => 0.35 + v * 0.5);

  // Measure the stream's level with a Web Audio analyser.
  useEffect(() => {
    if (!stream) return;
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioCtx();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;
    const read = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      live.current.level = Math.min(1, Math.sqrt(sum / data.length) * 4);
      frame = requestAnimationFrame(read);
    };
    read();
    return () => {
      cancelAnimationFrame(frame);
      context.close();
    };
  }, [stream]);

  // Redraw the blob each frame straight into the DOM (no React renders); pause while offscreen.
  useEffect(() => {
    const root = rootRef.current;
    const path = pathRef.current;
    if (!root || !path) return;
    const phases = Array.from({ length: POINTS }, (_, i) => [i * 1.7, i * 2.9, i * 0.6]);
    let frame = 0;
    let visible = true;
    let lv = 0;
    const draw = (t: number) => {
      const { state: s, level: target, reduce } = live.current;
      lv += (target - lv) * 0.2;
      loudness.set(s === "idle" ? 0 : lv);
      const time = t / 1000;
      const base = reduce ? 0 : s === "idle" ? 0.025 : s === "thinking" ? 0.06 : 0.035;
      const amp = base + (s === "listening" || s === "speaking" ? lv * 0.16 : 0);
      const speed = s === "thinking" ? 1.6 : s === "idle" ? 0.6 : 1.1;
      const points = phases.map(([a, b, c], i): [number, number] => {
        const angle = (i / POINTS) * Math.PI * 2;
        const wobble = 0.55 * Math.sin(time * speed * 1.3 + a) + 0.3 * Math.sin(time * speed * 2.1 + b) + 0.15 * Math.sin(time * speed * 3.7 + c);
        const r = 40 * (1 + amp * wobble);
        return [50 + Math.cos(angle) * r, 50 + Math.sin(angle) * r];
      });
      path.setAttribute("d", blobPath(points));
    };
    const tick = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(tick);
    });
    observer.observe(root);
    draw(0);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [loudness]);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={`${label}: ${STATE_TEXT[state]}`}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ ...style, width: size, height: size }}
      {...props}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-[12%] rounded-full blur-2xl"
        style={{ opacity: glow, background: `radial-gradient(circle, ${colors[1]}, transparent 70%)` }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        aria-hidden="true"
        className="relative overflow-visible"
        style={{ scale }}
        // While thinking, the gradient slowly turns.
        animate={state === "thinking" && !reduceMotion ? { rotate: 360 } : { rotate: 0 }}
        transition={state === "thinking" && !reduceMotion ? { duration: 6, repeat: Infinity, ease: "linear" } : { duration: 0.8 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="55%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </linearGradient>
        </defs>
        <path ref={pathRef} fill={`url(#${gradientId})`} d="M10,50a40,40 0 1,0 80,0a40,40 0 1,0 -80,0" />
        <ellipse cx="38" cy="34" rx="16" ry="10" fill="white" opacity={0.28} />
      </motion.svg>
    </div>
  );
}
