"use client";

import { useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, spring } from "@/lib/motion";

export interface SpringPressButtonProps
  extends Omit<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Visual style. @default "solid" */
  variant?: "solid" | "primary" | "outline" | "ghost";
  /** Button size. Small buttons keep a 40px hit area. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Scale while pressed. Lower values feel squishier. @default 0.95 */
  pressScale?: number;
  /** Spring used on release. "bouncy" overshoots slightly before settling. @default "bouncy" */
  release?: "snappy" | "smooth" | "bouncy";
}

const variantClasses = {
  solid:
    "bg-foreground text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.14),0_4px_12px_-2px_rgb(0_0_0/0.12)] hover:bg-foreground/90",
  primary:
    "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.12),0_4px_12px_-2px_color-mix(in_oklab,var(--primary)_40%,transparent)] hover:bg-primary/90",
  outline: "border border-border bg-background text-foreground shadow-xs hover:bg-accent",
  ghost: "text-foreground hover:bg-accent",
} as const;

const sizeClasses = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-[13px] after:absolute after:-inset-1 after:content-['']",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-12 gap-2 rounded-lg px-6 text-[15px]",
} as const;

const PRESS_KEYS = new Set([" ", "Enter"]);

export function SpringPressButton({
  variant = "solid",
  size = "md",
  pressScale = 0.95,
  release = "bouncy",
  type = "button",
  disabled,
  className,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: SpringPressButtonProps) {
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();

  const transition = reduceMotion
    ? { duration: duration.instant }
    : pressed
      ? spring.snappy
      : spring[release];

  return (
    <motion.button
      type={type}
      disabled={disabled}
      animate={reduceMotion ? { opacity: pressed ? 0.75 : 1 } : { scale: pressed ? pressScale : 1 }}
      transition={transition}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.button === 0) setPressed(true);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        setPressed(false);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setPressed(false);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        setPressed(false);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (PRESS_KEYS.has(event.key) && !event.repeat) setPressed(true);
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (PRESS_KEYS.has(event.key)) setPressed(false);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        setPressed(false);
      }}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap outline-none select-none",
        "transition-[background-color,border-color,color,box-shadow] duration-150",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
