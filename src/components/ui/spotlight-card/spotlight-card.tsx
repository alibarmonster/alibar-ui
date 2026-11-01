"use client";

import type { ComponentProps, PointerEvent } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

export interface SpotlightCardProps
  extends Omit<ComponentProps<"div">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Glow color across the surface. @default "color-mix(in oklab, var(--primary) 14%, transparent)" */
  color?: string;
  /** Glow color along the border. @default "color-mix(in oklab, var(--primary) 70%, transparent)" */
  borderColor?: string;
  /** Glow diameter in px. @default 380 */
  size?: number;
  /** Light up the border near the cursor too. @default true */
  border?: boolean;
}

const FADE = { stiffness: 260, damping: 30 };
// Keeps only a 1px ring at the edge: the content box is cut out of the full box.
const RING_MASK = {
  padding: 1,
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
} as const;

export function SpotlightCard({
  color = "color-mix(in oklab, var(--primary) 14%, transparent)",
  borderColor = "color-mix(in oklab, var(--primary) 70%, transparent)",
  size = 380,
  border = true,
  className,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: SpotlightCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const presence = useMotionValue(0);
  const opacity = useSpring(presence, FADE);

  // The glow is a fixed-size circle moved with transforms; nothing repaints a gradient per frame.
  const glow = (background: string) => (
    <motion.span
      className="absolute block rounded-full"
      style={{ width: size, height: size, left: -size / 2, top: -size / 2, x, y, opacity, background: `radial-gradient(circle, ${background}, transparent 70%)` }}
    />
  );

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event);
        if (event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
        presence.set(1);
      }}
      onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(event);
        presence.set(0);
      }}
      {...props}
    >
      {/* Pointer-driven only (it never moves on its own), so reduced motion needs no special case. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {glow(color)}
      </span>
      {border ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={RING_MASK}>
          {glow(borderColor)}
        </span>
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}
