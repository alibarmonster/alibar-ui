"use client";

import { useId } from "react";
import { LayoutGroup } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

/**
 * Demo-only control for previewing every state of a component (loading, success, error, empty…).
 * Not part of the registry.
 */
export function DemoStateSwitcher<T extends string>({
  states,
  value,
  onChange,
  label = "Preview state",
  className,
}: {
  states: readonly T[] | readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const options = states.map((s) => (typeof s === "string" ? { value: s, label: s } : s));
  return (
    <LayoutGroup id={id}>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn("inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full border border-border bg-surface p-0.5", className)}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative h-7 cursor-pointer rounded-full px-2.5 text-xs font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-foreground" : "text-foreground/60 hover:text-foreground",
              )}
            >
              {active ? (
                <m.span layoutId="demo-state" transition={spring.snappy} className="absolute inset-0 rounded-full border border-border bg-background shadow-xs" />
              ) : null}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
