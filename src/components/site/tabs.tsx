"use client";

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { LayoutGroup, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

type TabsVariant = "pill" | "underline";

const TabsContext = createContext<{ value: string; variant: TabsVariant; onValueChange: (value: string) => void }>({
  value: "",
  variant: "pill",
  onValueChange: () => {},
});

export function Tabs({
  value,
  onValueChange,
  variant = "pill",
  className,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  variant?: TabsVariant;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      <TabsContext.Provider value={{ value, variant, onValueChange }}>
        <LayoutGroup id={id}>{children}</LayoutGroup>
      </TabsContext.Provider>
    </TabsPrimitive.Root>
  );
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const { variant } = useContext(TabsContext);
  return (
    <TabsPrimitive.List
      className={cn(
        "relative inline-flex items-center",
        variant === "pill" ? "gap-0.5 rounded-[10px] bg-surface-2 p-[3px]" : "h-full gap-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  onMouseDown,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const context = useContext(TabsContext);
  const reduceMotion = useReducedMotion();
  const active = context.value === value;
  const transition = reduceMotion ? { duration: 0 } : spring.snappy;

  return (
    <TabsPrimitive.Trigger
      value={value}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.ctrlKey) return;
        // Radix focuses the trigger on mousedown, which Chrome can paint as a
        // keyboard focus ring. Select without moving focus instead.
        event.preventDefault();
        context.onValueChange(value);
      }}
      className={cn(
        "focus-ring relative inline-flex cursor-pointer items-center justify-center gap-1.5 text-[13px] font-medium whitespace-nowrap transition-colors select-none",
        context.variant === "pill"
          ? "h-8 rounded-[7px] px-3"
          : "h-full px-2.5 rounded-md",
        active ? "text-foreground" : "text-foreground/65 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {active ? (
        context.variant === "pill" ? (
          <m.span
            layoutId="tab-indicator"
            transition={transition}
            className="absolute inset-0 rounded-[7px] bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.06)]"
          />
        ) : (
          <m.span
            layoutId="tab-indicator"
            transition={transition}
            className="absolute inset-x-2 -bottom-px h-[1.5px] rounded-full bg-foreground"
          />
        )
      ) : null}
      <span className="relative inline-flex items-center gap-1.5">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("focus-ring", className)} {...props} />;
}
