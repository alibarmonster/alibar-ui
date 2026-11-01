"use client";

import type { ComponentProps, PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export interface TiltCardProps
  extends Omit<ComponentProps<"div">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Tilt in degrees at the card's edges. @default 10 */
  maxTilt?: number;
  /** Perspective distance in px; smaller is more dramatic. @default 900 */
  perspective?: number;
  /** Scale while the pointer is over the card. @default 1.02 */
  hoverScale?: number;
  /** Show a soft highlight that follows the cursor. @default true */
  glare?: boolean;
  /** Peak opacity of the glare. @default 0.3 */
  glareOpacity?: number;
}

const FOLLOW = { stiffness: 260, damping: 24, mass: 0.6 };

export function TiltCard({
  maxTilt = 10,
  perspective = 900,
  hoverScale = 1.02,
  glare = true,
  glareOpacity = 0.3,
  className,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: TiltCardProps) {
  const reduceMotion = useReducedMotion();
  // Pointer position over the card, from -0.5 to 0.5 on each axis.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const hover = useMotionValue(0);
  const x = useSpring(px, FOLLOW);
  const y = useSpring(py, FOLLOW);
  const h = useSpring(hover, FOLLOW);
  const rotateY = useTransform(x, (v) => v * maxTilt * 2);
  const rotateX = useTransform(y, (v) => -v * maxTilt * 2);
  const scale = useTransform(h, (v) => 1 + (hoverScale - 1) * v);
  // The glare layer is twice the card's size; shifting it by half the pointer offset puts its center under the cursor.
  const glareX = useTransform(x, (v) => `${v * 50}%`);
  const glareY = useTransform(y, (v) => `${v * 50}%`);
  const glareAlpha = useTransform(h, (v) => v * glareOpacity);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (reduceMotion || event.pointerType !== "mouse") return;
    const card = event.currentTarget;
    // The bounding box's center doesn't move while the card tilts, and offset sizes ignore transforms,
    // so the mapping stays stable mid-tilt.
    const rect = card.getBoundingClientRect();
    px.set(Math.max(-0.5, Math.min(0.5, (event.clientX - (rect.left + rect.width / 2)) / card.offsetWidth)));
    py.set(Math.max(-0.5, Math.min(0.5, (event.clientY - (rect.top + rect.height / 2)) / card.offsetHeight)));
    hover.set(1);
  };

  const handleLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    px.set(0);
    py.set(0);
    hover.set(0);
  };

  return (
    <motion.div
      className={cn("relative [transform-style:preserve-3d]", className)}
      style={{ ...style, transformPerspective: perspective, rotateX, rotateY, scale }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...props}
    >
      {children}
      {/* Always rendered (server and client match); under reduced motion it simply stays at opacity 0. */}
      {glare ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <motion.span
            className="absolute inset-[-50%] mix-blend-soft-light"
            style={{
              x: glareX,
              y: glareY,
              opacity: glareAlpha,
              background: "radial-gradient(circle at center, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0.25) 22%, transparent 48%)",
            }}
          />
        </span>
      ) : null}
    </motion.div>
  );
}
