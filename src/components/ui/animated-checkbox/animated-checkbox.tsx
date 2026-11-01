"use client";

import { useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export type CheckedState = boolean | "indeterminate";

export interface AnimatedCheckboxProps
  extends Omit<ComponentProps<typeof CheckboxPrimitive.Root>, "checked" | "defaultChecked" | "onCheckedChange" | "asChild"> {
  /** Controlled state. "indeterminate" draws a dash. */
  checked?: CheckedState;
  /** Initial state when uncontrolled. @default false */
  defaultChecked?: CheckedState;
  /** Called with the new state when toggled. */
  onCheckedChange?: (checked: CheckedState) => void;
  /** Box size. Every size keeps a 40px hit area. @default "md" */
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "size-4 rounded-[4px] after:-inset-3", icon: "size-3" },
  md: { box: "size-[18px] rounded-[5px] after:-inset-[11px]", icon: "size-3.5" },
  lg: { box: "size-[22px] rounded-[6px] after:-inset-[9px]", icon: "size-4" },
} as const;

export function AnimatedCheckbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  size = "md",
  className,
  ...props
}: AnimatedCheckboxProps) {
  const [internal, setInternal] = useState<CheckedState>(defaultChecked);
  const state = checked ?? internal;
  const reduceMotion = useReducedMotion();
  const filled = state !== false;
  const draw = (visible: boolean) =>
    reduceMotion
      ? { duration: 0 }
      : visible
        ? { duration: duration.base, ease: ease.out, delay: 0.06 }
        : { duration: duration.instant, ease: ease.out };

  return (
    <CheckboxPrimitive.Root
      checked={state}
      onCheckedChange={(next) => {
        if (checked === undefined) setInternal(next);
        onCheckedChange?.(next);
      }}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center border border-input bg-background shadow-xs outline-none",
        "transition-[border-color,box-shadow,transform] duration-150 after:absolute after:content-[''] active:scale-90",
        "hover:border-[color-mix(in_oklab,var(--input),var(--foreground)_25%)] focus-visible:ring-3 focus-visible:ring-ring/30",
        "data-[state=checked]:border-primary data-[state=indeterminate]:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        "aria-invalid:border-destructive",
        sizes[size].box,
        className,
      )}
      {...props}
    >
      {/* The fill pops in as a layer so the box never animates background-color. */}
      <motion.span
        aria-hidden="true"
        className="absolute -inset-px rounded-[inherit] bg-primary"
        initial={false}
        animate={filled ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduceMotion ? 1 : 0.55 }}
        transition={reduceMotion ? { duration: duration.instant } : filled ? spring.snappy : { duration: duration.quick }}
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={cn("relative text-primary-foreground", sizes[size].icon)}
      >
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={false}
          animate={{ pathLength: state === true ? 1 : 0, opacity: state === true ? 1 : 0 }}
          transition={draw(state === true)}
        />
        <motion.path
          d="M6.5 12h11"
          initial={false}
          animate={{ pathLength: state === "indeterminate" ? 1 : 0, opacity: state === "indeterminate" ? 1 : 0 }}
          transition={draw(state === "indeterminate")}
        />
      </svg>
    </CheckboxPrimitive.Root>
  );
}
