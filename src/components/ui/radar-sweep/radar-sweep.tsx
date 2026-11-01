"use client";

import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface RadarBlip {
  /** Bearing in degrees, clockwise from the top. */
  angle: number;
  /** Distance from the center, 0–1. */
  distance: number;
  /** Name read by screen readers and shown on hover. */
  label?: string;
}

export interface RadarSweepProps extends Omit<ComponentProps<"div">, "children"> {
  /** Points that light up as the sweep passes. */
  blips?: RadarBlip[];
  /** Seconds per revolution. @default 4 */
  duration?: number;
  /** Sweep and blip color. @default "var(--primary)" */
  color?: string;
  /** Number of range rings. @default 4 */
  rings?: number;
  /** Accessible label for the radar. @default "Radar" */
  label?: string;
}

// Keyframes ship with the component (React 19 hoists and de-duplicates this <style>).
const KEYFRAMES =
  "@keyframes alibar-radar-spin{to{transform:rotate(360deg)}}@keyframes alibar-radar-blip{0%{opacity:1;transform:translate(-50%,-50%) scale(1.5)}6%{opacity:1;transform:translate(-50%,-50%) scale(1)}70%,100%{opacity:.12;transform:translate(-50%,-50%) scale(1)}}";

export function RadarSweep({ blips = [], duration = 4, color = "var(--primary)", rings = 4, label = "Radar", className, style, ...props }: RadarSweepProps) {
  return (
    <div
      role="img"
      aria-label={blips.length ? `${label}: ${blips.map((b) => b.label).filter(Boolean).join(", ") || `${blips.length} contacts`}` : label}
      className={cn("relative aspect-square w-full max-w-80 overflow-hidden rounded-full border border-border bg-background", className)}
      style={{ "--radar": color, ...style } as CSSProperties}
      {...props}
    >
      <style href="alibar-radar-sweep" precedence="alibar">
        {KEYFRAMES}
      </style>
      {Array.from({ length: rings }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border"
          style={{ width: `${((i + 1) / rings) * 100}%`, height: `${((i + 1) / rings) * 100}%` }}
        />
      ))}
      <span aria-hidden="true" className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-border" />
      <span aria-hidden="true" className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-border" />
      {/* The sweep: a conic gradient whose bright leading edge sits at 0°, with a fading trail behind it. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full [animation:alibar-radar-spin_var(--radar-duration)_linear_infinite] motion-reduce:[animation:none] motion-reduce:rotate-[210deg]"
        style={
          {
            "--radar-duration": `${duration}s`,
            background: "conic-gradient(from 0deg, transparent 0deg 260deg, color-mix(in oklab, var(--radar) 28%, transparent) 358deg, color-mix(in oklab, var(--radar) 70%, transparent) 360deg)",
          } as CSSProperties
        }
      />
      {blips.map((blip, i) => {
        const radians = (blip.angle * Math.PI) / 180;
        const x = 50 + Math.sin(radians) * blip.distance * 50;
        const y = 50 - Math.cos(radians) * blip.distance * 50;
        // A negative delay puts each blip's flash exactly when the sweep reaches its bearing.
        const delay = ((((blip.angle % 360) + 360) % 360) / 360) * duration - duration;
        return (
          <span
            key={i}
            title={blip.label}
            aria-hidden="true"
            className="absolute size-2.5 rounded-full shadow-[0_0_10px_var(--radar)] [animation:alibar-radar-blip_var(--radar-duration)_linear_infinite] motion-reduce:[animation:none] motion-reduce:-translate-1/2 motion-reduce:opacity-70"
            style={{ left: `${x}%`, top: `${y}%`, background: "var(--radar)", "--radar-duration": `${duration}s`, animationDelay: `${delay}s` } as CSSProperties}
          />
        );
      })}
      <span aria-hidden="true" className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "var(--radar)" }} />
    </div>
  );
}
