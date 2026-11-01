"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface SegmentedControlOption {
  /** Value reported when the segment is chosen. */
  value: string;
  /** Visible label. Omit it for icon-only segments and pass aria-label instead. */
  label?: ReactNode;
  /** Icon shown before the label. */
  icon?: ReactNode;
  /** Accessible name for icon-only segments. */
  "aria-label"?: string;
  /** Prevents choosing this segment. */
  disabled?: boolean;
}

export interface SegmentedControlProps
  extends Omit<
    ComponentProps<typeof RadioGroupPrimitive.Root>,
    "value" | "defaultValue" | "onValueChange" | "asChild" | "children" | "orientation"
  > {
  /** The segments, in order. */
  options: SegmentedControlOption[];
  /** Controlled selected value. */
  value?: string;
  /** Initially selected value when uncontrolled. @default the first option */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void;
  /** Control height. @default "md" */
  size?: "sm" | "md";
  /** Stretch to the container width with equal segments. @default false */
  fullWidth?: boolean;
}

export function SegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  fullWidth = false,
  className,
  ...props
}: SegmentedControlProps) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value);
  const selected = value ?? internal;
  const reduceMotion = useReducedMotion();
  const groupId = useId();

  return (
    <RadioGroupPrimitive.Root
      orientation="horizontal"
      value={selected}
      onValueChange={(next) => {
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
      className={cn(
        "items-center gap-0.5 rounded-[10px] bg-muted p-[3px]",
        fullWidth ? "flex w-full" : "inline-flex",
        className,
      )}
      {...props}
    >
      <LayoutGroup id={groupId}>
        {options.map((option) => {
          const active = option.value === selected;
          const iconOnly = !option.label;
          return (
            <RadioGroupPrimitive.Item
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              aria-label={option["aria-label"]}
              className={cn(
                "relative inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[7px] font-medium whitespace-nowrap outline-none select-none",
                "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                "[&_svg]:size-4 [&_svg]:shrink-0",
                // Hit area grows vertically only, so neighbouring segments never overlap.
                "after:absolute after:inset-x-0 after:content-['']",
                size === "sm" ? "h-7 text-[13px] after:-inset-y-1.5" : "h-8 text-sm after:-inset-y-1",
                iconOnly ? (size === "sm" ? "w-8" : "w-9") : size === "sm" ? "px-2.5" : "px-3.5",
                fullWidth && "flex-1",
                active ? "text-foreground" : "text-foreground/65 hover:text-foreground",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="segment-pill"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[7px] bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.08),0_2px_6px_-2px_rgb(0_0_0/0.08)]"
                  transition={reduceMotion ? { duration: 0 } : spring.snappy}
                />
              ) : null}
              <span className="relative inline-flex items-center gap-1.5">
                {option.icon}
                {option.label}
              </span>
            </RadioGroupPrimitive.Item>
          );
        })}
      </LayoutGroup>
    </RadioGroupPrimitive.Root>
  );
}
