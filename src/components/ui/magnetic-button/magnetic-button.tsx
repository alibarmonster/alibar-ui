"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface MagneticButtonProps
  extends Omit<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Distance in px around the button where the pull begins. @default 80 */
  radius?: number;
  /** How far the button follows the cursor, as a fraction of the cursor's offset. @default 0.35 */
  strength?: number;
  /** Extra travel for the label on top of the button's, for a parallax feel. @default 0.4 */
  contentStrength?: number;
  /** Visual style. @default "solid" */
  variant?: "solid" | "primary" | "outline";
  /** Button size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Use "circle" for icon-only buttons. @default "default" */
  shape?: "default" | "circle";
}

const variantClasses = {
  solid:
    "bg-foreground text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.14),0_4px_12px_-2px_rgb(0_0_0/0.12)] hover:bg-foreground/90",
  primary:
    "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.12),0_4px_12px_-2px_color-mix(in_oklab,var(--primary)_40%,transparent)] hover:bg-primary/90",
  outline: "border border-border bg-background text-foreground shadow-xs hover:bg-accent",
} as const;

const sizeClasses = {
  default: {
    sm: "h-8 gap-1.5 rounded-md px-3 text-[13px] after:absolute after:-inset-1 after:content-['']",
    md: "h-10 gap-2 rounded-md px-4 text-sm",
    lg: "h-12 gap-2 rounded-lg px-6 text-[15px]",
  },
  circle: {
    sm: "size-8 rounded-full after:absolute after:-inset-1 after:content-['']",
    md: "size-10 rounded-full",
    lg: "size-14 rounded-full [&_svg]:size-5",
  },
} as const;

/** Smoothstep easing so the pull fades in gently at the edge of the radius. */
function falloff(t: number) {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}

export function MagneticButton({
  radius = 80,
  strength = 0.35,
  contentStrength = 0.4,
  variant = "solid",
  size = "md",
  shape = "default",
  type = "button",
  className,
  children,
  ...props
}: MagneticButtonProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const x = useSpring(pullX, { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(pullY, { stiffness: 220, damping: 18, mass: 0.6 });
  const contentX = useTransform(x, (v) => v * contentStrength);
  const contentY = useTransform(y, (v) => v * contentStrength);

  useEffect(() => {
    // Magnetism only makes sense for a hovering, precise pointer.
    if (reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const update = () => {
      frame = 0;
      const anchor = anchorRef.current;
      if (!anchor || !pointer) return;
      // The anchor never moves, so its rect is a stable reference point.
      const rect = anchor.getBoundingClientRect();
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);
      const edgeDistance = Math.max(Math.abs(dx) - rect.width / 2, Math.abs(dy) - rect.height / 2, 0);
      const pull = falloff(1 - edgeDistance / radius);
      pullX.set(dx * strength * pull);
      pullY.set(dy * strength * pull);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const reset = () => {
      pointer = null;
      pullX.set(0);
      pullY.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      reset();
    };
  }, [radius, strength, reduceMotion, pullX, pullY]);

  return (
    <span ref={anchorRef} className="relative inline-flex">
      <motion.button
        type={type}
        style={{ x, y }}
        whileTap={reduceMotion ? { opacity: 0.8 } : { scale: 0.96 }}
        transition={spring.snappy}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap outline-none select-none",
          "transition-[background-color,border-color,color,box-shadow] duration-150",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
          variantClasses[variant],
          sizeClasses[shape][size],
          className,
        )}
        {...props}
      >
        <motion.span style={{ x: contentX, y: contentY }} className="inline-flex items-center gap-[inherit]">
          {children}
        </motion.span>
      </motion.button>
    </span>
  );
}
