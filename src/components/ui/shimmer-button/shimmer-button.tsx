"use client";

import { useEffect, type ComponentProps } from "react";
import { motion, useAnimate, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ease, spring } from "@/lib/motion";

export interface ShimmerButtonProps
  extends Omit<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** When the light sweep plays: on a loop, or once per hover and focus. @default "loop" */
  trigger?: "loop" | "hover";
  /** Seconds for one sweep across the button. @default 1.4 */
  duration?: number;
  /** Seconds between sweeps in loop mode. @default 1.8 */
  delay?: number;
  /** Visual style. @default "solid" */
  variant?: "solid" | "primary" | "outline";
  /** Button size. @default "md" */
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  solid:
    "bg-foreground text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.14),0_4px_12px_-2px_rgb(0_0_0/0.12)] hover:bg-foreground/90",
  primary:
    "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.12),0_4px_12px_-2px_color-mix(in_oklab,var(--primary)_40%,transparent)] hover:bg-primary/90",
  outline: "border border-border bg-background text-foreground shadow-xs hover:bg-accent",
} as const;

const sweepClasses = {
  solid: "via-white/40",
  primary: "via-white/45",
  outline: "via-primary/15",
} as const;

const sizeClasses = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-[13px] after:absolute after:-inset-1 after:content-['']",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-12 gap-2 rounded-lg px-6 text-[15px]",
} as const;

// The band spans 35–65% of the layer, so ±70% starts and ends just out of view.
const SWEEP = { x: ["-70%", "70%"] };
// Near-linear, so the band crosses the visible area at an even pace.
const SWEEP_EASE = [0.45, 0.05, 0.55, 0.95] as const;

export function ShimmerButton({
  trigger = "loop",
  duration = 1.4,
  delay = 1.8,
  variant = "solid",
  size = "md",
  type = "button",
  className,
  children,
  onPointerEnter,
  onFocus,
  ...props
}: ShimmerButtonProps) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const inView = useInView(scope);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Loop only while visible; nothing animates off-screen.
    if (trigger !== "loop" || reduceMotion || !inView || !scope.current) return;
    const controls = animate(scope.current, SWEEP, {
      duration,
      ease: SWEEP_EASE,
      repeat: Infinity,
      repeatDelay: delay,
    });
    return () => controls.stop();
  }, [trigger, reduceMotion, inView, duration, delay, animate, scope]);

  const sweepOnce = () => {
    if (trigger === "hover" && !reduceMotion && scope.current) {
      animate(scope.current, SWEEP, { duration: duration * 0.8, ease: ease.out });
    }
  };

  return (
    <motion.button
      type={type}
      whileTap={reduceMotion ? { opacity: 0.8 } : { scale: 0.97 }}
      transition={spring.snappy}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        sweepOnce();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        sweepOnce();
      }}
      className={cn(
        "relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden font-medium whitespace-nowrap outline-none select-none",
        "transition-[background-color,border-color,color,box-shadow] duration-150",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <span
        ref={scope}
        aria-hidden="true"
        style={{ transform: "translateX(-70%)" }}
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-linear-110 from-transparent from-35% to-transparent to-65%",
          sweepClasses[variant],
        )}
      />
      {children}
    </motion.button>
  );
}
