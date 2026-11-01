"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface SpringSwitchProps
  extends Omit<
    ComponentProps<"button">,
    "value" | "defaultValue" | "onChange" | "role" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
  > {
  /** Controlled state. */
  checked?: boolean;
  /** Initial state when uncontrolled. @default false */
  defaultChecked?: boolean;
  /** Called with the new state when toggled. */
  onCheckedChange?: (checked: boolean) => void;
  /** Switch size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Submits "on" under this name while checked, like a checkbox. */
  name?: string;
}

// Track padding is 2px; travel = track width − thumb − 4.
const sizes = {
  sm: { track: "h-5 w-8 after:-inset-2.5", thumb: "size-4", travel: 12 },
  md: { track: "h-6 w-11 after:-inset-2", thumb: "size-5", travel: 20 },
  lg: { track: "h-8 w-14 after:-inset-1", thumb: "size-7", travel: 24 },
} as const;

// Low damping gives the thumb an overshoot and a second, smaller bounce.
const TRAVEL = { type: "spring", stiffness: 560, damping: 17, mass: 0.8 } as const;

export function SpringSwitch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  size = "md",
  name,
  disabled,
  className,
  onClick,
  type = "button",
  ...props
}: SpringSwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const on = checked ?? internal;
  const [thumb, animate] = useAnimate<HTMLSpanElement>();
  const previous = useRef(on);
  const reduceMotion = useReducedMotion();
  const s = sizes[size];

  // Squash and stretch on every change, including ones driven by a controlled prop.
  useEffect(() => {
    if (previous.current === on) return;
    previous.current = on;
    if (reduceMotion || !thumb.current) return;
    animate(
      thumb.current,
      { scaleX: [1, 1.3, 0.86, 1.06, 0.98, 1], scaleY: [1, 0.8, 1.12, 0.95, 1.01, 1] },
      { duration: 0.55, times: [0, 0.2, 0.45, 0.65, 0.82, 1], ease: "easeOut" },
    );
  }, [on, reduceMotion, animate, thumb]);

  return (
    <>
      <button
        type={type}
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (checked === undefined) setInternal(!on);
          onCheckedChange?.(!on);
        }}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full bg-[color-mix(in_oklab,var(--foreground)_15%,var(--background))] outline-none",
          "after:absolute after:content-[''] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          s.track,
          className,
        )}
        {...props}
      >
        {/* The "on" color fades in as a layer rather than animating background-color. */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-primary"
          initial={false}
          animate={{ opacity: on ? 1 : 0 }}
          transition={{ duration: duration.quick }}
        />
        <motion.span
          ref={thumb}
          aria-hidden="true"
          className={cn(
            "absolute top-0.5 left-0.5 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2),0_2px_6px_-1px_rgb(0_0_0/0.15)]",
            s.thumb,
          )}
          initial={false}
          animate={{ x: on ? s.travel : 0 }}
          transition={reduceMotion ? { duration: duration.quick } : TRAVEL}
        />
      </button>
      {name && on ? <input type="hidden" name={name} value="on" /> : null}
    </>
  );
}
