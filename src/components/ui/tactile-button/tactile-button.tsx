"use client";

import { useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TactileButtonProps
  extends Omit<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Keycap color. @default "neutral" */
  variant?: "neutral" | "dark" | "primary";
  /** Size. "key" renders a square keycap. @default "md" */
  size?: "sm" | "md" | "lg" | "key";
  /** Height of the keycap edge in px. @default 4 */
  depth?: number;
  /** Forces the pressed look, for example to mirror a physical key. */
  pressed?: boolean;
}

const faceClasses = {
  neutral:
    "border border-border bg-background text-foreground shadow-[inset_0_1px_0_rgb(255_255_255),inset_0_-1px_0_rgb(0_0_0/0.04)]",
  dark: "bg-[color-mix(in_oklab,var(--foreground)_84%,var(--background))] text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]",
  primary: "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.28)]",
} as const;

const edgeClasses = {
  neutral: "bg-[color-mix(in_oklab,var(--foreground)_17%,var(--background))]",
  dark: "bg-foreground",
  primary: "bg-[color-mix(in_oklab,var(--primary)_62%,black)]",
} as const;

const sizeClasses = {
  sm: { button: "h-8 gap-1.5 rounded-md text-[13px] after:absolute after:-inset-1 after:content-['']", face: "px-3" },
  md: { button: "h-10 gap-2 rounded-md text-sm", face: "px-5" },
  lg: { button: "h-12 gap-2 rounded-lg text-[15px]", face: "px-7" },
  key: { button: "size-12 rounded-md text-sm", face: "px-0" },
} as const;

const PRESS_KEYS = new Set([" ", "Enter"]);

export function TactileButton({
  variant = "neutral",
  size = "md",
  depth = 4,
  pressed: pressedProp,
  type = "button",
  className,
  style,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: TactileButtonProps) {
  const [pressedState, setPressed] = useState(false);
  const pressed = pressedProp ?? pressedState;
  const reduceMotion = useReducedMotion();

  // Sinking is near-instant; the release springs back with a hint of overshoot.
  const travel = reduceMotion
    ? { duration: 0 }
    : pressed
      ? { duration: 0.06, ease: "easeOut" as const }
      : { type: "spring" as const, stiffness: 700, damping: 22 };

  return (
    <button
      type={type}
      style={{ marginBottom: depth, ...style }}
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
        "group relative inline-flex shrink-0 cursor-pointer font-medium whitespace-nowrap outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        sizeClasses[size].button,
        className,
      )}
      {...props}
    >
      {/* Soft ground shadow that tightens as the key goes down. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1.5 h-2.5 rounded-full bg-black/20 blur-[5px]"
        style={{ bottom: -depth - 3 }}
        initial={false}
        animate={{ opacity: pressed ? 0.4 : 1, scaleX: pressed ? 0.9 : 1 }}
        transition={travel}
      />
      {/* The edge: same shape as the face, sitting `depth` px lower. */}
      <span
        aria-hidden="true"
        className={cn("absolute inset-0 rounded-[inherit]", edgeClasses[variant])}
        style={{ transform: `translateY(${depth}px)` }}
      />
      <motion.span
        initial={false}
        animate={{ y: pressed ? depth - 1 : 0 }}
        transition={travel}
        className={cn(
          "relative flex h-full w-full items-center justify-center gap-[inherit] rounded-[inherit]",
          sizeClasses[size].face,
          faceClasses[variant],
        )}
      >
        {children}
      </motion.span>
    </button>
  );
}
