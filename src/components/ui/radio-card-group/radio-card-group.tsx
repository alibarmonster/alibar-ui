"use client";

import { createContext, useContext, useId, useState, type ComponentProps, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { duration, spring } from "@/lib/motion";

const RadioCardContext = createContext<string | undefined>(undefined);

export interface RadioCardGroupProps
  extends Omit<ComponentProps<typeof RadioGroupPrimitive.Root>, "value" | "defaultValue" | "onValueChange" | "asChild"> {
  /** Controlled selected value. */
  value?: string;
  /** Initially selected value when uncontrolled. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void;
}

export function RadioCardGroup({ value, defaultValue, onValueChange, className, children, ...props }: RadioCardGroupProps) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const groupId = useId();

  return (
    <RadioGroupPrimitive.Root
      value={selected ?? ""}
      onValueChange={(next) => {
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
      className={cn("grid gap-3", className)}
      {...props}
    >
      <RadioCardContext.Provider value={selected}>
        <LayoutGroup id={groupId}>{children}</LayoutGroup>
      </RadioCardContext.Provider>
    </RadioGroupPrimitive.Root>
  );
}

export interface RadioCardProps
  extends Omit<ComponentProps<typeof RadioGroupPrimitive.Item>, "asChild" | "children" | "title"> {
  /** Value submitted and reported when this card is chosen. */
  value: string;
  /** Main label. */
  title: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Icon shown at the start of the card. */
  icon?: ReactNode;
  /** Content at the end of the card, such as a price. */
  aside?: ReactNode;
}

export function RadioCard({ value, title, description, icon, aside, className, ...props }: RadioCardProps) {
  const selected = useContext(RadioCardContext);
  const reduceMotion = useReducedMotion();
  const checked = selected === value;

  return (
    <RadioGroupPrimitive.Item
      value={value}
      className={cn(
        "group relative flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 text-left shadow-xs outline-none",
        "transition-[border-color,box-shadow,transform] duration-150 hover:border-[color-mix(in_oklab,var(--border),var(--foreground)_18%)] active:scale-[0.99]",
        "focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        className,
      )}
      {...props}
    >
      {/* One ring per group, shared by layoutId, so it glides to the newly chosen card. */}
      {checked ? (
        <motion.span
          layoutId="radio-card-ring"
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px border-2 border-primary"
          style={{ borderRadius: 14 }}
          transition={reduceMotion ? { duration: 0 } : spring.snappy}
        />
      ) : null}
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "relative flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted transition-colors duration-200 [&_svg]:size-4",
            checked ? "text-primary" : "text-muted-foreground",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="relative min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        {description ? <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{description}</span> : null}
      </span>
      {aside ? <span className="relative shrink-0 text-sm font-medium text-foreground tabular-nums">{aside}</span> : null}
      <span
        aria-hidden="true"
        className={cn(
          "relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border bg-background transition-colors duration-200",
          checked ? "border-primary" : "border-input",
        )}
      >
        <motion.span
          className="size-2.5 rounded-full bg-primary"
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={reduceMotion ? { duration: duration.instant } : checked ? spring.bouncy : { duration: duration.quick }}
        />
      </span>
    </RadioGroupPrimitive.Item>
  );
}
