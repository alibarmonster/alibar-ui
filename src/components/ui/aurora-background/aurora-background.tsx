"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface AuroraBackgroundProps
  extends Omit<ComponentProps<"div">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Blob colors, up to four. Light pastels work best on white. @default sky, violet, pink and amber 200 */
  colors?: string[];
  /** Speed multiplier; 2 drifts twice as fast. @default 1 */
  speed?: number;
  /** Overall strength of the blobs, 0–1. @default 0.85 */
  intensity?: number;
  /** Fade the aurora out toward the bottom edge. @default true */
  fadeBottom?: boolean;
}

const DEFAULT_COLORS = ["#bae6fd", "#ddd6fe", "#fbcfe8", "#fde68a"];

// Each blob drifts on its own long loop, so the pattern never visibly repeats.
const BLOBS = [
  { size: "70%", top: "-30%", left: "-15%", x: ["0%", "16%", "6%", "0%"], y: ["0%", "12%", "24%", "0%"], scale: [1, 1.12, 0.94, 1], duration: 26 },
  { size: "60%", top: "-20%", left: "45%", x: ["0%", "-18%", "-6%", "0%"], y: ["0%", "18%", "6%", "0%"], scale: [1, 0.9, 1.1, 1], duration: 31 },
  { size: "55%", top: "25%", left: "15%", x: ["0%", "20%", "-10%", "0%"], y: ["0%", "-14%", "8%", "0%"], scale: [1, 1.15, 1, 1], duration: 23 },
  { size: "50%", top: "30%", left: "60%", x: ["0%", "-12%", "10%", "0%"], y: ["0%", "-20%", "-6%", "0%"], scale: [1, 1.05, 0.92, 1], duration: 35 },
];

export function AuroraBackground({
  colors = DEFAULT_COLORS,
  speed = 1,
  intensity = 0.85,
  fadeBottom = true,
  className,
  children,
  ...props
}: AuroraBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const fade = "linear-gradient(to bottom, #000 55%, transparent)";

  return (
    <div className={cn("relative isolate overflow-hidden bg-background", className)} {...props}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ opacity: intensity, ...(fadeBottom ? { maskImage: fade, WebkitMaskImage: fade } : {}) }}
      >
        {BLOBS.slice(0, Math.max(1, colors.length)).map((blob, i) => (
          <motion.div
            key={i}
            className="absolute aspect-square rounded-full mix-blend-multiply will-change-transform"
            style={{
              width: blob.size,
              top: blob.top,
              left: blob.left,
              background: `radial-gradient(circle at center, ${colors[i % colors.length]} 0%, transparent 66%)`,
            }}
            // Soft radial gradients instead of blur filters: cheap to paint, and only transforms animate.
            animate={reduceMotion ? undefined : { x: blob.x, y: blob.y, scale: blob.scale }}
            transition={{ duration: blob.duration / Math.max(speed, 0.05), repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
