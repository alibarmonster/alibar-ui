"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface RippleRingsProps extends Omit<ComponentProps<"div">, "children"> {
  /** The icon or avatar the rings pulse behind. */
  children: ReactNode;
  /** Number of rings in flight. @default 3 */
  count?: number;
  /** Ring color. @default "var(--primary)" */
  color?: string;
  /** Seconds for one ring to travel out. @default 2.4 */
  duration?: number;
  /** How far rings grow, as a multiple of the center's size. @default 2.6 */
  scale?: number;
  /** "outline" rings or soft "filled" discs. @default "outline" */
  variant?: "outline" | "filled";
}

const KEYFRAMES = "@keyframes alibar-ripple{0%{transform:scale(1);opacity:.55}100%{transform:scale(var(--ripple-scale));opacity:0}}";

export function RippleRings({ children, count = 3, color = "var(--primary)", duration = 2.4, scale = 2.6, variant = "outline", className, style, ...props }: RippleRingsProps) {
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ "--ripple": color, "--ripple-scale": scale, ...style } as CSSProperties} {...props}>
      <style href="alibar-ripple-rings" precedence="alibar">
        {KEYFRAMES}
      </style>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-full [animation:alibar-ripple_var(--ripple-duration)_cubic-bezier(0.22,1,0.36,1)_infinite] motion-reduce:[animation:none]",
            variant === "outline" ? "border-2 border-[var(--ripple)]" : "bg-[color-mix(in_oklab,var(--ripple)_30%,transparent)]",
          )}
          style={
            {
              "--ripple-duration": `${duration}s`,
              animationDelay: `${(i * duration) / count}s`,
            } as CSSProperties
          }
        />
      ))}
      {/* Reduced motion: rings rest at evenly spaced sizes instead of travelling. */}
      <span className="pointer-events-none absolute inset-0 hidden motion-reduce:block" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-full border border-[var(--ripple)]"
            style={{ transform: `scale(${1 + ((scale - 1) * (i + 1)) / (count + 1)})`, opacity: 0.35 - i * 0.08 }}
          />
        ))}
      </span>
      <div className="relative">{children}</div>
    </div>
  );
}
